import sys
import json
from eth_account import Account
from eth_account.messages import encode_defunct

# Bật tính năng Mnemonic nếu cần (tùy chọn)
Account.enable_unaudited_hdwallet_features()

def generate_wallet():
    # 1. Tạo Private/Public Key ngẫu nhiên
    acct = Account.create()
    
    # 2. Address Derivation (Thư viện tự làm bước Keccak-256 -> last 20 bytes)
    print(f"--- NEW WALLET ---")
    print(f"Private Key: {acct.key.hex()}")
    print(f"Address:     {acct.address}")


def sign_message(message_str, private_key_hex):
    # 3. Signing
    try:
        # Đóng gói message theo chuẩn Ethereum để an toàn
        message = encode_defunct(text=message_str)
        
        # Ký message
        signed_message = Account.sign_message(message, private_key=private_key_hex)
        
        print(f"--- SIGNED MESSAGE ---")
        print(f"Message: {message_str}")
        print(f"Signature (Hex): {signed_message.signature.hex()}")
        return signed_message.signature.hex()
    except Exception as e:
        print(f"Error signing: {e}")

def is_valid_address(address):
    """Kiểm tra định dạng cơ bản của địa chỉ Ethereum (0x + 40 ký tự hex)."""
    # Loại bỏ tiền tố '0x' nếu có
    if address.startswith('0x') or address.startswith('0X'):
        address = address[2:]
        
    # Phải có đúng 40 ký tự hex
    if len(address) != 40:
        return False
    
    # Kiểm tra xem tất cả ký tự có phải là hex (0-9, a-f, A-F)
    try:
        int(address, 16)
        return True
    except ValueError:
        return False

def verify_signature(message_str, signature_hex, expected_address):
    # 0. Thêm bước Xác thực Địa chỉ đầu vào
    if not is_valid_address(expected_address):
        print(f"--- VERIFICATION ERROR ---")
        print(f"Result: INVALID Address Format ❌ (Expected address '{expected_address}' không hợp lệ)")
        return False
        
    # 4. Verification
    try:
        message = encode_defunct(text=message_str)
        
        # Phục hồi địa chỉ từ chữ ký
        recovered_address = Account.recover_message(message, signature=signature_hex)
        
        print(f"--- VERIFICATION ---")
        print(f"Message: {message_str}")
        print(f"Signature: {signature_hex[:10]}...")
        print(f"Expected Address: {expected_address}")
        print(f"Recovered Signer: {recovered_address}")
        
        # So sánh địa chỉ đã phục hồi với địa chỉ mong đợi (case-insensitive)
        if recovered_address.lower() == expected_address.lower():
            print("Result: VALID Signature ✅")
            return True
        else:
            print("Result: INVALID Signature ❌ (Address mismatch)")
            return False
            
    except Exception as e:
        print(f"--- VERIFICATION ERROR ---")
        print(f"Error verifying: Lỗi trong quá trình phục hồi chữ ký. Chữ ký hoặc tin nhắn có thể không hợp lệ. ({e})")
        return False

# 5. Interface CLI
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python wallet.py [generate | sign | verify]")
        sys.exit(1)

    command = sys.argv[1]

    if command == "generate":
        generate_wallet()
        
    elif command == "sign":
        # Ví dụ cách dùng: python wallet.py sign "Transfer 5 ETH" <private_key>
        if len(sys.argv) < 4:
            print('Usage: python wallet.py sign "Message" <private_key>')
        else:
            msg = sys.argv[2]
            pk = sys.argv[3]
            sign_message(msg, pk)
    elif command == "verify":
        # Ví dụ: python wallet.py verify "Transfer 5 ETH" <signature> <address>
        if len(sys.argv) < 5:
            print('Usage: python wallet.py verify "Message" <signature_hex> <expected_address>')
        else:
            msg = sys.argv[2]
            signature = sys.argv[3]
            address = sys.argv[4]
            verify_signature(msg, signature, address)