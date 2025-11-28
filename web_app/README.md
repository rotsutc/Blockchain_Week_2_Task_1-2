## Thành viên nhóm

| Họ và tên | MSSV |
|-----------|------|
| Đỗ Quốc Khánh | 2591307 |
| Nguyễn Thành Quí | 2591320 |
| Trần Thị Bảo My | 2591314 |


> **Ứng dụng ví điện tử blockchain đầy đủ tính năng với ECDSA cryptography, multi-hash algorithm support, CLI/GUI interface, và nhiều tính năng bảo mật nâng cao.**

---

## 📋 Tổng Quan Dự Án

###  Giới thiệu

Crypto Wallet là một ứng dụng web-based blockchain wallet hoàn chỉnh, được phát triển với mục đích học tập và minh họa các khái niệm bảo mật trong blockchain. Ứng dụng triển khai đầy đủ quy trình từ **Key Generation**, **Address Derivation**, **Digital Signing** đến **Signature Verification**, đồng thời bổ sung nhiều tính năng nâng cao như **Mnemonic Recovery**, **Batch Signing**, và **Message Encryption**.


### Đặc điểm nổi bật

| Tính năng | Mô tả |
|-----------|-------|
| 🔑 **ECDSA Cryptography** | Sử dụng secp256k1 curve (Bitcoin/Ethereum standard) |
| 🎨 **Dual Interface** | CLI Terminal + GUI cards với đồng bộ real-time |
| 🔐 **Multi-Hash Support** | 5 thuật toán: SHA-256, SHA-512, Keccak-256, SHA3-256, RIPEMD-160 |
| 📝 **Mnemonic Phrases** | BIP39-style 12-word seed phrases cho wallet recovery |
| 📦 **Batch Processing** | Ký nhiều giao dịch cùng lúc với batch signing |
| 💾 **Transaction History** | Persistent storage với LocalStorage API |
| 🔒 **Message Encryption** | ECDH-based end-to-end encryption |
| 🎯 **Professional UI** | Dark theme, animations, responsive design |

---

## 🚀 Hướng Dẫn Khởi Động

### Yêu cầu hệ thống

- **Python**: Python 3.x (hoặc Node.js)
- **Browser**: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- **Internet**: Để tải các CDN libraries

### Phương pháp 1: Python HTTP Server ⭐ (Khuyến nghị)

Đây là cách đơn giản và phổ biến nhất, không cần cài đặt gì thêm.

```bash
# Bước 1: Mở Terminal/PowerShell
# Windows: Win+R → gõ "powershell"
# Mac/Linux: Mở Terminal

# Bước 2: Di chuyển đến thư mục dự án
cd d:\thacsiute\blockchain\day2\code

# Bước 3: Khởi động HTTP server
python -m http.server 8000

# Nếu có cả Python 2 và 3, dùng:
python3 -m http.server 8000

# Bước 4: Mở trình duyệt và truy cập
# http://localhost:8000
```

**Tắt server**: Nhấn `Ctrl + C` trong terminal

---

## 📚 Kiến Thức Nền Tảng

### 1. Elliptic Curve Cryptography (ECC)

#### Giới thiệu

ECC là một hệ thống mật mã khóa công khai dựa trên đường cong elliptic trên các trường hữu hạn. So với RSA, ECC cung cấp cùng mức độ bảo mật với kích thước khóa nhỏ hơn đáng kể.

#### Đường cong secp256k1

```
y² = x³ + 7 (mod p)
```

Trong đó:
- **p**: Số nguyên tố lớn (2²⁵⁶ - 2³² - 977)
- **Kích thước**: 256-bit keys
- **Sử dụng**: Bitcoin, Ethereum, và nhiều blockchain khác

#### Private Key và Public Key

```
Private Key (d) ∈ [1, n-1]  (256-bit random number)
Public Key (Q) = d × G       (Point on curve)
```

Trong đó:
- **G**: Base point (generator point)
- **n**: Order of G
- **Q**: Public key point (x, y coordinates)

#### Ví dụ

```javascript
// Generate private key (random 256-bit number)
const privateKey = "a1b2c3d4e5f6..."; // 64 hex characters

// Generate public key (point multiplication)
const publicKey = ec.keyFromPrivate(privateKey).getPublic('hex');
// Result: "04xyz123abc456..." (128 hex characters, uncompressed)
```

---

### 2. Mnemonic Phrases (Seed Phrases)

#### Khái niệm

**Mnemonic phrase** (hay seed phrase) là một chuỗi các từ tiếng Anh (thường 12, 15, 18, hoặc 24 từ) được sử dụng để tạo và khôi phục ví blockchain. Đây là cách đơn giản hơn để sao lưu private key so với việc ghi nhớ chuỗi hexadecimal 64 ký tự.

#### Tiêu chuẩn BIP39

**BIP39** (Bitcoin Improvement Proposal 39) định nghĩa quy trình tạo mnemonic phrases:

```
Entropy (128-256 bits)
    ↓
Add Checksum (Entropy + SHA256 hash)
    ↓
Split into 11-bit segments
    ↓
Map to wordlist (2048 words)
    ↓
Mnemonic Phrase (12-24 words)
    ↓
PBKDF2-HMAC-SHA512 (with passphrase)
    ↓
512-bit Seed
    ↓
HD Wallet (BIP32/BIP44)
```

#### Ví dụ Mnemonic Phrase

```
abandon ability able about above absent absorb abstract absurd abuse access accident
```

→ Tạo ra 512-bit seed  
→ Tạo ra private key: `a1b2c3d4...`

#### Ưu điểm

1. **Dễ ghi nhớ**: 12 từ tiếng Anh dễ nhớ hơn 64 ký tự hex
2. **An toàn**: Entropy cao (128-256 bits)
3. **Tiêu chuẩn hóa**: BIP39 được hỗ trợ rộng rãi
4. **Khôi phục dễ dàng**: Nhập 12 từ để khôi phục toàn bộ ví

#### Trong ứng dụng này

Ứng dụng triển khai **simplified mnemonic** (không phải BIP39 đầy đủ):

```javascript
// Convert private key → mnemonic
privateKey = "a1b2c3d4..." (hex)
    ↓
Split into chunks → [a1b2, c3d4, ...]
    ↓
Map to wordlist → [abandon, ability, ...]
    ↓
12 words mnemonic
```

⚠️ **Lưu ý**: Đây là simplified version cho mục đích học tập. Production apps nên sử dụng BIP39 library đầy đủ.

**Sử dụng:**

```javascript
// Tạo mnemonic từ private key
const mnemonic = generateMnemonic(privateKey);
// Result: "abandon ability able about above absent absorb abstract absurd abuse access accident"

// Khôi phục private key từ mnemonic
const recoveredKey = mnemonicToPrivateKey(mnemonic);
// Result: "a1b2c3d4..." (giống private key ban đầu)
```

---

### 3. Batch Signing (Ký Hàng Loạt)

#### Khái niệm

**Batch Signing** là quá trình ký nhiều giao dịch (transactions) cùng một lúc với cùng một private key. Điều này tiết kiệm thời gian và tăng hiệu suất khi cần xử lý nhiều giao dịch.

#### Use Cases (Trường hợp sử dụng)

1. **Exchange Withdrawals**: Sàn giao dịch xử lý hàng ngàn lệnh rút tiền
2. **Payroll Systems**: Trả lương cho nhiều nhân viên cùng lúc
3. **Airdrop Distribution**: Phân phối token cho nhiều địa chỉ
4. **Multi-recipient Transfers**: Gửi tiền cho nhiều người nhận

#### Quy trình Batch Signing

```
Input: Array of transactions
[
  {"to": "0x123...", "amount": 1, "currency": "ETH"},
  {"to": "0x456...", "amount": 2, "currency": "ETH"},
  {"to": "0x789...", "amount": 3, "currency": "ETH"}
]

For each transaction:
    1. Serialize transaction → JSON string
    2. Hash with chosen algorithm (SHA-256, Keccak-256,...)
    3. Sign hash with ECDSA private key
    4. Generate signature (r, s, v)
    5. Store signature

Output: Array of signatures
[
  {tx: 1, signature: "3045..."},
  {tx: 2, signature: "3046..."},
  {tx: 3, signature: "3047..."}
]
```

#### Lợi ích

| Lợi ích | Mô tả |
|---------|-------|
| ⚡ **Hiệu suất cao** | Xử lý hàng trăm giao dịch trong vài giây |
| 💰 **Tiết kiệm chi phí** | Giảm số lần nhập private key |
| 🔒 **Bảo mật** | Private key chỉ cần load 1 lần |
| 📊 **Quản lý tốt** | Theo dõi nhiều giao dịch cùng lúc |

#### Trong ứng dụng này

```javascript
// Batch signing implementation
function batchSign() {
    const messages = [
        '{"to": "0x123...", "amount": 1}',
        '{"to": "0x456...", "amount": 2}',
        '{"to": "0x789...", "amount": 3}'
    ];
    
    const results = [];
    const keyPair = ec.keyFromPrivate(privateKey, 'hex');
    
    messages.forEach((message, index) => {
        // Hash message
        const hash = hashMessage(message, algorithm);
        
        // Sign hash
        const signature = keyPair.sign(hash);
        
        // Store result
        results.push({
            index: index + 1,
            message: message,
            signature: signature.toDER('hex'),
            timestamp: Date.now()
        });
    });
    
    return results;
}
```

#### Best Practices

- ✅ **Validate inputs**: Kiểm tra tất cả transactions trước khi ký
- ✅ **Error handling**: Xử lý lỗi cho từng transaction riêng biệt
- ✅ **Transaction history**: Lưu lại tất cả signatures
- ✅ **Rate limiting**: Giới hạn số lượng transactions mỗi batch
- ✅ **Confirmation**: Yêu cầu xác nhận trước khi ký nhiều giao dịch

#### Ví dụ thực tế

```javascript
// Input: 3 transactions
[
  {"to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "amount": 5, "currency": "ETH"},
  {"to": "0x8Ddf3c1F6b8c2D7A3e5F4a9b0C1d2E3f4A5B6C7D", "amount": 10, "currency": "ETH"},
  {"to": "0x9Eef4d2G7c9d3E8B4f6G5b1D2e4F5b6C7d8E9F0", "amount": 15, "currency": "ETH"}
]

// Output: 3 signatures
[
  {tx: 1, sig: "3045022100a1b2c3...", time: 1700000001},
  {tx: 2, sig: "3045022100d4e5f6...", time: 1700000002},
  {tx: 3, sig: "3045022100g7h8i9...", time: 1700000003}
]
```

---

## ✨ Các Tính Năng Chi Tiết

### 1. 🔑 Key Generation (Tạo Khóa)

#### Mô tả

Tạo cặp khóa Private/Public key sử dụng thuật toán **ECDSA** với đường cong **secp256k1** (chuẩn Bitcoin và Ethereum).

#### Quy trình

```
1. Generate random 256-bit number → Private Key (d)
2. Multiply Private Key với base point G → Public Key (Q = d × G)
3. Hash Public Key với Keccak-256 → Ethereum Address
```

#### Sử dụng

**CLI:**
```bash
$ wallet generate
```

**GUI:**
- Click nút "✨ Tạo Ví"
- Private Key, Public Key, Address hiển thị
- Click 📋 để copy

#### Output

```
Private Key: a1b2c3d4e5f67890... (64 hex chars)
Public Key:  04xyz123abc456...    (128 hex chars, uncompressed)
Address:     0x742d35Cc6634...    (40 hex chars with 0x prefix)
```

#### Code implementation

```javascript
function generateWallet() {
    // Generate random key pair
    const keyPair = ec.genKeyPair();
    
    // Get private key (hex string)
    const privateKey = keyPair.getPrivate('hex');
    
    // Get public key (uncompressed, with 04 prefix)
    const publicKey = keyPair.getPublic('hex');
    
    // Derive Ethereum address from public key
    const address = deriveAddress(publicKey);
    
    return { privateKey, publicKey, address, keyPair };
}
```

---

### 2. 📍 Address Derivation (Tạo Địa Chỉ)

#### Mô tả

Tạo địa chỉ Ethereum từ Public Key sử dụng thuật toán **Keccak-256**.

#### Quy trình (Ethereum Standard)

```
Public Key (uncompressed): 04xyz123abc456...
    ↓
Remove "04" prefix: xyz123abc456...
    ↓
Keccak-256 hash: abcdef123456789...
    ↓
Take last 20 bytes: ...3456789 (40 hex chars)
    ↓
Add "0x" prefix: 0x...3456789
    ↓
Ethereum Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

#### Checksum (EIP-55)

Ethereum addresses sử dụng **mixed-case checksum** để phát hiện lỗi:

```javascript
function toChecksumAddress(address) {
    const hash = keccak256(address.toLowerCase());
    let checksumAddress = '0x';
    
    for (let i = 0; i < address.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            checksumAddress += address[i].toUpperCase();
        } else {
            checksumAddress += address[i].toLowerCase();
        }
    }
    
    return checksumAddress;
}
```

#### Ví dụ

```javascript
// Input
publicKey = "04a1b2c3d4e5f6..."

// Process
publicKey = "a1b2c3d4e5f6..." // Remove 04 prefix
hash = keccak256(publicKey)
address = "0x" + hash.slice(-40) // Last 20 bytes

// Output
address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

---

### 3. ✍️ Digital Signing (Ký Số)

#### Mô tả

Ký giao dịch JSON với Private Key sử dụng **ECDSA**, hỗ trợ **5 thuật toán hash** khác nhau.

#### Các thuật toán hash

| Thuật toán | Output Size | Sử dụng | Độ bảo mật |
|------------|-------------|---------|------------|
| **SHA-256** | 256-bit | Bitcoin, Ethereum | Cao |
| **SHA-512** | 512-bit | Bảo mật cao hơn | Rất cao |
| **Keccak-256** | 256-bit | Ethereum native | Cao |
| **SHA3-256** | 256-bit | Chuẩn mới nhất | Cao |
| **RIPEMD-160** | 160-bit | Bitcoin address | Trung bình |

#### Quy trình

```
1. Input: Message (JSON) + Private Key + Hash Algorithm
    ↓
2. Serialize message → String
    ↓
3. Hash message với algorithm → message hash
    ↓
4. Sign hash với ECDSA private key → (r, s) values
    ↓
5. Encode signature → DER format
    ↓
6. Output: Signature (hex string)
```

#### Sử dụng

**CLI:**
```bash
$ wallet sign "Transfer 5 ETH"
$ wallet sign '{"to": "0x123...", "amount": 5}'
```

**GUI:**
- Nhập Private Key
- Chọn Hash Algorithm
- Nhập Message JSON
- Click "✍️ Ký Giao Dịch"

#### Code implementation

```javascript
function signMessage(message, privateKeyHex, algorithm) {
    // Get key pair from private key
    const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');
    
    // Hash message with chosen algorithm
    const messageHash = hashMessage(message, algorithm);
    
    // Sign hash
    const signature = keyPair.sign(messageHash);
    
    // Convert to DER format
    const signatureHex = signature.toDER('hex');
    
    return signatureHex;
}
```

---

### 4. ✅ Signature Verification (Xác Thực Chữ Ký)

#### Mô tả

Xác minh chữ ký số với Public Key để kiểm tra tính toàn vẹn và xác thực nguồn gốc của dữ liệu.

#### Quy trình

```
1. Input: Message + Public Key + Signature + Hash Algorithm
    ↓
2. Hash message với cùng algorithm → message hash
    ↓
3. Verify signature với public key và hash
    ↓
4. Output: Valid ✅ or Invalid ❌
```

#### Sử dụng

**CLI:**
```bash
$ wallet verify
# Sau đó nhập: public key, message, signature
```

**GUI:**
- Nhập Public Key
- Chọn Hash Algorithm (phải giống lúc ký)
- Nhập Message (phải giống lúc ký)
- Nhập Signature
- Click "🔍 Xác Thực"

#### Code implementation

```javascript
function verifySignature(message, publicKeyHex, signatureHex, algorithm) {
    try {
        // Get key pair from public key
        const keyPair = ec.keyFromPublic(publicKeyHex, 'hex');
        
        // Hash message with same algorithm
        const messageHash = hashMessage(message, algorithm);
        
        // Verify signature
        const isValid = keyPair.verify(messageHash, signatureHex);
        
        return isValid;
    } catch (error) {
        return false;
    }
}
```

---

### 5. 💻 Command Line Interface (CLI)

#### Mô tả

Terminal emulator với command-line interface tương tác, giống như terminal thật.

#### Các lệnh

| Lệnh | Mô tả |
|------|-------|
| `wallet generate` | Tạo ví mới |
| `wallet sign "message"` | Ký giao dịch |
| `wallet verify` | Xác thực chữ ký |
| `wallet import "key"` | Import ví từ private key |
| `wallet address` | Hiển thị địa chỉ ví |
| `wallet balance` | Xem chi tiết ví |
| `wallet export` | Export thông tin ví |
| `wallet mnemonic` | Hiển thị mnemonic phrase |
| `wallet restore "12 words"` | Khôi phục từ mnemonic |
| `help` | Hiển thị trợ giúp |
| `clear` | Xóa màn hình |

#### Ví dụ sử dụng

```bash
# Tạo ví mới
$ wallet generate
✓ Wallet generated successfully!
Private Key: a1b2c3d4...
Public Key:  04xyz123...
Address:     0x742d35...

# Ký giao dịch
$ wallet sign '{"to": "0x123...", "amount": 5, "currency": "ETH"}'
✓ Message signed successfully!
Signature: 3045022100...

# Import ví
$ wallet import "a1b2c3d4e5f67890..."
✓ Wallet imported successfully!
Address: 0x742d35...

# Xem địa chỉ
$ wallet address
Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Tạo mnemonic
$ wallet mnemonic
Mnemonic: abandon ability able about above absent absorb abstract absurd abuse access accident

# Khôi phục từ mnemonic
$ wallet restore "abandon ability able about above absent absorb abstract absurd abuse access accident"
✓ Wallet restored successfully!
Address: 0x742d35...
```

#### Tính năng

- ✅ Command history (lưu lịch sử lệnh)
- ✅ Auto-scroll terminal
- ✅ Syntax highlighting
- ✅ Error handling đầy đủ
- ✅ CLI-GUI synchronization

---

### 6. 📦 Batch Signing (Ký Hàng Loạt)

#### Mô tả

Ký nhiều giao dịch cùng lúc, mỗi dòng một giao dịch JSON.

#### Sử dụng

**GUI:**
1. Nhập Private Key
2. Nhập nhiều giao dịch JSON (mỗi dòng một giao dịch):
```json
{"to": "0x123...", "amount": 1, "currency": "ETH"}
{"to": "0x456...", "amount": 2, "currency": "ETH"}
{"to": "0x789...", "amount": 3, "currency": "ETH"}
```
3. Click "📦 Ký Hàng Loạt"
4. Tất cả signatures hiển thị

#### Output

```
✅ Giao dịch #1
Message: {"to": "0x123...", "amount": 1, "currency": "ETH"}
Signature: 3045022100a1b2c3...

✅ Giao dịch #2
Message: {"to": "0x456...", "amount": 2, "currency": "ETH"}
Signature: 3045022100d4e5f6...

✅ Giao dịch #3
Message: {"to": "0x789...", "amount": 3, "currency": "ETH"}
Signature: 3045022100g7h8i9...

✅ Đã ký 3/3 giao dịch!
```

---

### 7. 📜 Transaction History

#### Mô tả

Lưu trữ lịch sử tất cả giao dịch đã ký vào LocalStorage, persistent ngay cả khi tắt trình duyệt.

#### Thông tin lưu trữ

- Timestamp (thời gian ký)
- Message (nội dung giao dịch)
- Signature (chữ ký)
- Hash algorithm (thuật toán đã sử dụng)
- Type (single sign hoặc batch sign)

#### Sử dụng

- Tự động lưu khi ký giao dịch
- Hiển thị trong card "Lịch Sử Giao Dịch"
- Có nút "Xóa Lịch Sử"

---

### 8. 🔐 Message Encryption/Decryption

#### Mô tả

Mã hóa/giải mã tin nhắn sử dụng **ECDH** (Elliptic Curve Diffie-Hellman) cho end-to-end encryption.

#### Quy trình

**Mã hóa:**
```
1. Sender có: Private Key A, Public Key B (người nhận)
2. Tạo shared secret: ECDH(Private A, Public B)
3. Encrypt message với shared secret
4. Gửi ciphertext cho người nhận
```

**Giải mã:**
```
1. Receiver có: Private Key B, Public Key A (người gửi)
2. Tạo shared secret: ECDH(Private B, Public A)
3. Decrypt ciphertext với shared secret
4. Nhận plaintext message
```

#### Sử dụng

**Mã hóa:**
1. Tab "Mã hóa"
2. Nhập Public Key người nhận
3. Nhập tin nhắn
4. Click "🔒 Mã Hóa"

**Giải mã:**
1. Tab "Giải mã"
2. Nhập Private Key của bạn
3. Nhập tin nhắn đã mã hóa
4. Click "🔓 Giải Mã"

---

### 9. 📥 Import/Export Wallet

#### Import từ Private Key

- Nhập Private Key (64 hex chars)
- Click "📥 Import Ví"
- Wallet được khôi phục

#### Import từ Mnemonic

- Nhập 12 từ seed phrase
- Click "📥 Import từ Mnemonic"
- Wallet được khôi phục từ mnemonic

#### Export Private Key

- Click "🔑 Export Private Key"
- Private Key hiển thị (có cảnh báo bảo mật)

#### Tạo Mnemonic

- Click "📝 Tạo Mnemonic"
- 12 từ mnemonic hiển thị
- Ghi lại và cất giữ an toàn

---
