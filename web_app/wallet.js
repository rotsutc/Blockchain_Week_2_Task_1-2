// Sử dụng elliptic curve cryptography (secp256k1) giống như Bitcoin/Ethereum
const EC = elliptic.ec;
const ec = new EC('secp256k1');

let currentWallet = null;
let transactionHistory = [];

// Load transaction history from localStorage
if (localStorage.getItem('transactionHistory')) {
    transactionHistory = JSON.parse(localStorage.getItem('transactionHistory'));
    displayTransactionHistory();
}

/**
 * Hash Functions - Support Multiple Algorithms
 */
function hashMessage(message, algorithm) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    switch(algorithm) {
        case 'sha256':
            // Using CryptoJS
            return CryptoJS.SHA256(message).toString();
            
        case 'sha512':
            return CryptoJS.SHA512(message).toString();
            
        case 'keccak256':
            // Using js-sha3
            return keccak256(message);
            
        case 'sha3-256':
            return CryptoJS.SHA3(message, { outputLength: 256 }).toString();
            
        case 'ripemd160':
            return CryptoJS.RIPEMD160(message).toString();
            
        default:
            return CryptoJS.SHA256(message).toString();
    }
}

// Update hash info when algorithm changes
function updateHashInfo() {
    const algorithm = document.getElementById('hashAlgorithm').value;
    const infoElement = document.getElementById('hashInfo');
    
    const infoTexts = {
        'sha256': '🔐 SHA-256: Thuật toán băm 256-bit được sử dụng trong Bitcoin và Ethereum',
        'sha512': '🔐 SHA-512: Phiên bản an toàn hơn với 512-bit, chậm hơn nhưng bảo mật cao hơn',
        'keccak256': '🔐 Keccak-256: Thuật toán gốc của Ethereum, khác với SHA3-256 chuẩn',
        'sha3-256': '🔐 SHA3-256: Tiêu chuẩn mới nhất của NIST, an toàn và hiện đại',
        'ripemd160': '🔐 RIPEMD-160: Sử dụng trong địa chỉ Bitcoin, ra 160-bit hash'
    };
    
    infoElement.textContent = infoTexts[algorithm] || infoTexts['sha256'];
}

/**
 * Task 1: Key Generation
 * Tạo cặp khóa Private/Public key
 */
function generateWallet() {
    try {
        // Tạo cặp khóa mới
        const keyPair = ec.genKeyPair();
        
        // Lấy private key (hex format)
        const privateKey = keyPair.getPrivate('hex');
        
        // Lấy public key (hex format, uncompressed)
        const publicKey = keyPair.getPublic('hex');
        
        // Task 2: Address Derivation
        // Tạo địa chỉ ví từ public key (giống Ethereum)
        const address = deriveAddress(publicKey);
        
        // Lưu wallet hiện tại
        currentWallet = {
            privateKey,
            publicKey,
            address,
            keyPair
        };
        
        // Sync với CLI wallet
        cliWallet = currentWallet;
        
        // Hiển thị kết quả
        displayWalletInfo(privateKey, publicKey, address);
        
        // Thêm thông báo vào CLI terminal
        addTerminalLine('✓ Wallet generated via GUI', 'success');
        addTerminalLine(`Address: ${address}`, 'output');
        
        showToast('✅ Ví đã được tạo thành công!', 'success');
        
    } catch (error) {
        console.error('Error generating wallet:', error);
        showToast('❌ Lỗi khi tạo ví: ' + error.message, 'error');
    }
}

/**
 * Task 2: Address Derivation
 * Tạo địa chỉ ví từ public key (sử dụng Keccak-256 như Ethereum)
 */
function deriveAddress(publicKeyHex) {
    // Loại bỏ prefix '04' từ uncompressed public key
    const pubKeyWithoutPrefix = publicKeyHex.slice(2);
    
    // Hash public key với Keccak-256
    const hash = keccak256(hexToBytes(pubKeyWithoutPrefix));
    
    // Lấy 20 bytes cuối cùng và thêm prefix '0x'
    const address = '0x' + hash.slice(-40);
    
    return address;
}

/**
 * Task 3: Signing
 * Ký một message (JSON) với private key
 */
function signMessage() {
    try {
        const privateKeyHex = document.getElementById('signPrivateKey').value.trim();
        const message = document.getElementById('messageToSign').value.trim();
        const hashAlgorithm = document.getElementById('hashAlgorithm').value;
        
        if (!privateKeyHex) {
            showToast('⚠️ Vui lòng nhập private key!', 'error');
            return;
        }
        
        // Validate private key format (64 hex characters)
        if (!/^[0-9a-fA-F]{64}$/.test(privateKeyHex)) {
            showToast('❌ Private key không hợp lệ! Phải có đúng 64 ký tự hex (0-9, a-f)', 'error');
            return;
        }
        
        if (!message) {
            showToast('⚠️ Vui lòng nhập nội dung giao dịch!', 'error');
            return;
        }
        
        // Kiểm tra JSON hợp lệ
        let messageObj;
        try {
            messageObj = JSON.parse(message);
        } catch (e) {
            showToast('⚠️ Nội dung phải là JSON hợp lệ!', 'error');
            return;
        }
        
        // Validate địa chỉ Ethereum trong transaction
        if ('to' in messageObj) {
            if (!messageObj.to || !/^0x[0-9a-fA-F]{40}$/.test(messageObj.to)) {
                showToast('❌ Địa chỉ "to" không hợp lệ! Phải có định dạng: 0x + 40 ký tự hex (vd: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4)', 'error');
                return;
            }
        }
        
        // Validate amount nếu có
        if (messageObj.amount !== undefined) {
            if (typeof messageObj.amount !== 'number' || messageObj.amount <= 0) {
                showToast('❌ Amount phải là số dương!', 'error');
                return;
            }
        }
        
        // Tạo key pair từ private key
        const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');
        
        // Hash message với thuật toán được chọn
        const messageHash = hashMessage(message, hashAlgorithm);
        
        console.log('Using hash algorithm:', hashAlgorithm);
        console.log('Message hash:', messageHash);
        
        // Ký message
        const signature = keyPair.sign(messageHash);
        
        // Chuyển signature sang định dạng DER (hex)
        const signatureHex = signature.toDER('hex');
        
        // Hiển thị signature
        document.getElementById('signature').textContent = signatureHex;
        document.getElementById('signatureResult').style.display = 'block';
        
        // Add to transaction history
        addToHistory('sign', {
            message: messageObj,
            signature: signatureHex,
            publicKey: keyPair.getPublic('hex'),
            hashAlgorithm: hashAlgorithm
        });
        
        // Thông báo trong CLI
        addTerminalLine(`✓ Message signed via GUI (${hashAlgorithm.toUpperCase()})`, 'success');
        addTerminalLine(`Signature: ${signatureHex.substring(0, 50)}...`, 'output');
        
        showToast(`✅ Đã ký giao dịch với ${hashAlgorithm.toUpperCase()}!`, 'success');
        
    } catch (error) {
        console.error('Error signing message:', error);
        showToast('❌ Lỗi khi ký: ' + error.message, 'error');
    }
}

/**
 * Task 4: Verification
 * Xác thực chữ ký với public key
 */
function verifySignature() {
    try {
        const publicKeyHex = document.getElementById('verifyPublicKey').value.trim();
        const message = document.getElementById('messageToVerify').value.trim();
        const signatureHex = document.getElementById('signatureToVerify').value.trim();
        const hashAlgorithm = document.getElementById('verifyHashAlgorithm').value;
        
        if (!publicKeyHex || !message || !signatureHex) {
            showToast('⚠️ Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }
        
        // Validate public key format (130 hex characters for uncompressed key with 04 prefix)
        if (!/^04[0-9a-fA-F]{128}$/.test(publicKeyHex) && !/^[0-9a-fA-F]{128}$/.test(publicKeyHex)) {
            showToast('❌ Public key không hợp lệ! Phải có 128 hoặc 130 ký tự hex', 'error');
            return;
        }
        
        // Validate signature format (DER encoded signature in hex)
        if (!/^[0-9a-fA-F]+$/.test(signatureHex) || signatureHex.length < 64) {
            showToast('❌ Signature không hợp lệ! Phải là chuỗi hex hợp lệ', 'error');
            return;
        }
        
        // Kiểm tra JSON hợp lệ
        let messageObj;
        try {
            messageObj = JSON.parse(message);
        } catch (e) {
            showToast('⚠️ Nội dung phải là JSON hợp lệ!', 'error');
            return;
        }
        
        // Validate địa chỉ Ethereum trong message
        if ('to' in messageObj) {
            if (!messageObj.to || !/^0x[0-9a-fA-F]{40}$/.test(messageObj.to)) {
                showToast('❌ Địa chỉ "to" không hợp lệ! Phải có định dạng: 0x + 40 ký tự hex', 'error');
                return;
            }
        }
        
        // Tạo key pair từ public key
        const keyPair = ec.keyFromPublic(publicKeyHex, 'hex');
        
        // Hash message với thuật toán được chọn
        const messageHash = hashMessage(message, hashAlgorithm);
        
        console.log('Verifying with hash algorithm:', hashAlgorithm);
        console.log('Message hash:', messageHash);
        
        // Xác thực chữ ký
        const isValid = keyPair.verify(messageHash, signatureHex);
        
        // Hiển thị kết quả
        const resultDiv = document.getElementById('verifyResult');
        const statusDiv = document.getElementById('verifyStatus');
        
        resultDiv.style.display = 'block';
        statusDiv.className = 'verification-status ' + (isValid ? 'valid' : 'invalid');
        statusDiv.textContent = isValid ? '✅ Chữ ký hợp lệ!' : '❌ Chữ ký không hợp lệ!';
        
        // Add to transaction history
        if (isValid) {
            addToHistory('verify', {
                message: JSON.parse(message),
                signature: signatureHex,
                publicKey: publicKeyHex,
                hashAlgorithm: hashAlgorithm,
                status: 'valid'
            });
        }
        
        // Thông báo trong CLI
        if (isValid) {
            addTerminalLine(`✓ Signature verified via GUI (${hashAlgorithm.toUpperCase()})`, 'success');
        } else {
            addTerminalLine('✗ Signature verification failed via GUI', 'error');
        }
        
        showToast(isValid ? `✅ Xác thực thành công với ${hashAlgorithm.toUpperCase()}!` : '❌ Chữ ký không hợp lệ!', isValid ? 'success' : 'error');
        
    } catch (error) {
        console.error('Error verifying signature:', error);
        showToast('❌ Lỗi khi xác thực: ' + error.message, 'error');
    }
}

/**
 * Helper Functions
 */

// Hiển thị thông tin ví
function displayWalletInfo(privateKey, publicKey, address) {
    document.getElementById('privateKey').textContent = privateKey;
    document.getElementById('publicKey').textContent = publicKey;
    document.getElementById('address').textContent = address;
    document.getElementById('walletResult').style.display = 'block';
}

// Copy to clipboard
function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Đã copy vào clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('❌ Không thể copy!', 'error');
    });
}

// Hiển thị toast notification
function showToast(message, type) {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Scroll to wallet section
function scrollToWallet() {
    document.getElementById('wallet').scrollIntoView({ behavior: 'smooth' });
}

// SHA-256 hash function
function sha256(message) {
    const buffer = new TextEncoder().encode(message);
    return crypto.subtle.digest('SHA-256', buffer).then(hash => {
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    });
}

// Synchronous SHA-256 for signing (using js-sha3 library's sha256)
function sha256(message) {
    // Convert message to bytes
    const msgBytes = new TextEncoder().encode(message);
    // Use built-in crypto if available, otherwise fallback
    const hash = Array.from(msgBytes).reduce((acc, byte) => {
        return acc + byte.toString(16).padStart(2, '0');
    }, '');
    
    // Simple hash for demo - in production use proper SHA-256
    let h = 0;
    for (let i = 0; i < message.length; i++) {
        h = ((h << 5) - h) + message.charCodeAt(i);
        h = h & h;
    }
    
    // Better approach: use the message directly as hash for demo
    // In real app, use crypto.subtle.digest or a proper library
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashArray = Array.from(data);
    const hashHex = hashArray.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
    
    return hashHex;
}

// Convert hex string to bytes
function hexToBytes(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return new Uint8Array(bytes);
}

// Auto-fill from generated wallet
document.getElementById('signPrivateKey').addEventListener('focus', function() {
    if (currentWallet && !this.value) {
        this.value = currentWallet.privateKey;
    }
});

document.getElementById('verifyPublicKey').addEventListener('focus', function() {
    if (currentWallet && !this.value) {
        this.value = currentWallet.publicKey;
    }
});

// Example transaction for demo
document.getElementById('messageToSign').value = JSON.stringify({
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
    "amount": 5,
    "currency": "ETH",
    "timestamp": Date.now()
}, null, 2);

document.getElementById('messageToVerify').value = JSON.stringify({
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
    "amount": 5,
    "currency": "ETH",
    "timestamp": Date.now()
}, null, 2);

/**
 * Advanced Features
 */

// Import Wallet from Private Key
function importWallet() {
    try {
        const privateKeyHex = document.getElementById('importPrivateKey').value.trim();
        
        if (!privateKeyHex) {
            showToast('⚠️ Vui lòng nhập private key!', 'error');
            return;
        }
        
        // Validate private key format (64 hex characters)
        if (!/^[0-9a-fA-F]{64}$/.test(privateKeyHex)) {
            showToast('❌ Private key không hợp lệ! Phải có đúng 64 ký tự hex (0-9, a-f)', 'error');
            return;
        }
        
        // Tạo key pair từ private key
        const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');
        
        // Lấy public key
        const publicKey = keyPair.getPublic('hex');
        
        // Tạo địa chỉ
        const address = deriveAddress(publicKey);
        
        // Lưu wallet hiện tại
        currentWallet = {
            privateKey: privateKeyHex,
            publicKey,
            address,
            keyPair
        };
        
        // Sync với CLI
        cliWallet = currentWallet;
        
        // Hiển thị kết quả
        displayWalletInfo(privateKeyHex, publicKey, address);
        
        // Thông báo trong CLI
        addTerminalLine('✓ Wallet imported via GUI', 'success');
        addTerminalLine(`Address: ${address}`, 'output');
        
        showToast('✅ Import ví thành công!', 'success');
        
        // Clear input
        document.getElementById('importPrivateKey').value = '';
        
    } catch (error) {
        console.error('Error importing wallet:', error);
        showToast('❌ Private key không hợp lệ!', 'error');
    }
}

// Export Private Key
function exportPrivateKey() {
    if (!currentWallet) {
        showToast('⚠️ Vui lòng tạo hoặc import ví trước!', 'error');
        return;
    }
    
    const confirm = window.confirm('⚠️ CẢNH BÁO: Private key là thông tin cực kỳ nhạy cảm!\n\nBất kỳ ai có private key đều có thể truy cập ví của bạn.\nBạn có chắc chắn muốn hiển thị private key?');
    
    if (!confirm) return;
    
    document.getElementById('exportLabel').textContent = '🔑 Private Key (GIỮ BÍ MẬT!):';
    document.getElementById('exportContent').textContent = currentWallet.privateKey;
    document.getElementById('exportResult').style.display = 'block';
    
    showToast('⚠️ Đừng chia sẻ private key với ai!', 'error');
}

// Generate Mnemonic Phrase (12 words)
function showMnemonic() {
    if (!currentWallet) {
        showToast('⚠️ Vui lòng tạo hoặc import ví trước!', 'error');
        return;
    }
    
    // Generate mnemonic from private key (simplified)
    const mnemonic = generateMnemonic(currentWallet.privateKey);
    
    document.getElementById('exportLabel').textContent = '📝 Mnemonic Phrase (GIỮ BÍ MẬT!):';
    document.getElementById('exportContent').textContent = mnemonic;
    document.getElementById('exportResult').style.display = 'block';
    
    showToast('✅ Đã tạo mnemonic! Ghi lại và cất giữ an toàn.', 'success');
}

// Clear Wallet
function clearWallet() {
    const confirm = window.confirm('Bạn có chắc chắn muốn xóa ví hiện tại?\n\nHãy chắc chắn bạn đã backup private key!');
    
    if (!confirm) return;
    
    currentWallet = null;
    cliWallet = null; // Sync với CLI
    document.getElementById('walletResult').style.display = 'none';
    document.getElementById('exportResult').style.display = 'none';
    
    addTerminalLine('✓ Wallet cleared', 'output');
    
    showToast('🗑️ Đã xóa ví!', 'success');
}

// Batch Sign Multiple Transactions
function batchSign() {
    try {
        const privateKeyHex = document.getElementById('batchPrivateKey').value.trim();
        const messages = document.getElementById('batchMessages').value.trim();
        
        if (!privateKeyHex || !messages) {
            showToast('⚠️ Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }
        
        // Parse messages (one JSON per line)
        const lines = messages.split('\n').filter(line => line.trim());
        const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');
        
        let results = '';
        let successCount = 0;
        
        lines.forEach((line, index) => {
            try {
                const messageObj = JSON.parse(line);
                
                // Validate địa chỉ Ethereum
                if ('to' in messageObj) {
                    if (!messageObj.to || !/^0x[0-9a-fA-F]{40}$/.test(messageObj.to)) {
                        throw new Error(`Địa chỉ "to" không hợp lệ! Phải có định dạng: 0x + 40 ký tự hex`);
                    }
                }
                
                // Validate amount
                if (messageObj.amount !== undefined && (typeof messageObj.amount !== 'number' || messageObj.amount <= 0)) {
                    throw new Error('Amount phải là số dương!');
                }
                
                const messageHash = sha256(line);
                const signature = keyPair.sign(messageHash);
                const signatureHex = signature.toDER('hex');
                
                results += `<div class="batch-item">
                    <div class="batch-item-header">✅ Giao dịch #${index + 1}</div>
                    <div class="batch-item-content">
                        <strong>Message:</strong> ${line}<br>
                        <strong>Signature:</strong> ${signatureHex}
                    </div>
                </div>`;
                
                successCount++;
                
                // Add to history
                addToHistory('batch-sign', {
                    message: messageObj,
                    signature: signatureHex,
                    batchIndex: index + 1
                });
                
            } catch (error) {
                results += `<div class="batch-item" style="border-left-color: var(--error);">
                    <div class="batch-item-header" style="color: var(--error);">❌ Giao dịch #${index + 1} - Lỗi</div>
                    <div class="batch-item-content">${error.message}</div>
                </div>`;
            }
        });
        
        document.getElementById('batchSignatures').innerHTML = results;
        document.getElementById('batchResult').style.display = 'block';
        
        showToast(`✅ Đã ký ${successCount}/${lines.length} giao dịch!`, 'success');
        
    } catch (error) {
        console.error('Error batch signing:', error);
        showToast('❌ Lỗi khi ký hàng loạt: ' + error.message, 'error');
    }
}

// Transaction History Management
function addToHistory(type, data) {
    const transaction = {
        id: Date.now(),
        type,
        data,
        timestamp: new Date().toLocaleString('vi-VN')
    };
    
    transactionHistory.unshift(transaction);
    
    // Limit to 50 transactions
    if (transactionHistory.length > 50) {
        transactionHistory = transactionHistory.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));
    
    displayTransactionHistory();
}

function displayTransactionHistory() {
    const container = document.getElementById('transactionHistory');
    
    if (transactionHistory.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Chưa có giao dịch nào</p>';
        return;
    }
    
    let html = '';
    transactionHistory.forEach(tx => {
        const icon = tx.type === 'sign' ? '✍️' : tx.type === 'verify' ? '✅' : '📦';
        const typeText = tx.type === 'sign' ? 'Ký giao dịch' : tx.type === 'verify' ? 'Xác thực' : 'Ký hàng loạt';
        const hashAlgo = tx.data.hashAlgorithm ? ` (${tx.data.hashAlgorithm.toUpperCase()})` : '';
        
        html += `<div class="transaction-item">
            <div class="transaction-header">
                <span class="transaction-type">${icon} ${typeText}${hashAlgo}</span>
                <span class="transaction-time">${tx.timestamp}</span>
            </div>
            <div class="transaction-details">
                <strong>Message:</strong> ${JSON.stringify(tx.data.message).substring(0, 100)}...
            </div>
            ${tx.data.signature ? `<div class="transaction-signature">Signature: ${tx.data.signature.substring(0, 50)}...</div>` : ''}
        </div>`;
    });
    
    container.innerHTML = html;
}

function clearHistory() {
    const confirm = window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử?');
    if (!confirm) return;
    
    transactionHistory = [];
    localStorage.removeItem('transactionHistory');
    displayTransactionHistory();
    showToast('🗑️ Đã xóa lịch sử!', 'success');
}

// Message Encryption/Decryption
function switchEncryptTab(tab) {
    const encryptTab = document.getElementById('encryptTab');
    const decryptTab = document.getElementById('decryptTab');
    const buttons = document.querySelectorAll('.tab-button');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'encrypt') {
        encryptTab.classList.add('active');
        decryptTab.classList.remove('active');
        buttons[0].classList.add('active');
    } else {
        decryptTab.classList.add('active');
        encryptTab.classList.remove('active');
        buttons[1].classList.add('active');
    }
}

// Switch Import Tabs
function switchImportTab(tab) {
    const privateKeyTab = document.getElementById('importPrivateKeyTab');
    const mnemonicTab = document.getElementById('importMnemonicTab');
    const buttons = document.querySelectorAll('.import-tab-btn');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'privatekey') {
        privateKeyTab.classList.add('active');
        mnemonicTab.classList.remove('active');
        buttons[0].classList.add('active');
    } else {
        mnemonicTab.classList.add('active');
        privateKeyTab.classList.remove('active');
        buttons[1].classList.add('active');
    }
}

function encryptMessage() {
    try {
        const publicKeyHex = document.getElementById('encryptPublicKey').value.trim();
        const message = document.getElementById('messageToEncrypt').value.trim();
        
        if (!publicKeyHex || !message) {
            showToast('⚠️ Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }
        
        // Simple encryption using ECDH
        const recipientKey = ec.keyFromPublic(publicKeyHex, 'hex');
        const ephemeralKey = ec.genKeyPair();
        
        // Compute shared secret
        const sharedSecret = ephemeralKey.derive(recipientKey.getPublic());
        const sharedSecretHex = sharedSecret.toString(16);
        
        // Encrypt message (simple XOR for demo)
        const encrypted = simpleEncrypt(message, sharedSecretHex);
        
        const result = {
            ephemeralPublicKey: ephemeralKey.getPublic('hex'),
            ciphertext: encrypted
        };
        
        document.getElementById('cryptoLabel').textContent = '🔒 Tin nhắn đã mã hóa:';
        document.getElementById('cryptoContent').textContent = JSON.stringify(result, null, 2);
        document.getElementById('cryptoResult').style.display = 'block';
        
        showToast('✅ Đã mã hóa tin nhắn!', 'success');
        
    } catch (error) {
        console.error('Error encrypting:', error);
        showToast('❌ Lỗi khi mã hóa: ' + error.message, 'error');
    }
}

function decryptMessage() {
    try {
        const privateKeyHex = document.getElementById('decryptPrivateKey').value.trim();
        const encryptedData = document.getElementById('messageToDecrypt').value.trim();
        
        if (!privateKeyHex || !encryptedData) {
            showToast('⚠️ Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }
        
        const data = JSON.parse(encryptedData);
        const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');
        const ephemeralKey = ec.keyFromPublic(data.ephemeralPublicKey, 'hex');
        
        // Compute shared secret
        const sharedSecret = keyPair.derive(ephemeralKey.getPublic());
        const sharedSecretHex = sharedSecret.toString(16);
        
        // Decrypt message
        const decrypted = simpleDecrypt(data.ciphertext, sharedSecretHex);
        
        document.getElementById('cryptoLabel').textContent = '🔓 Tin nhắn đã giải mã:';
        document.getElementById('cryptoContent').textContent = decrypted;
        document.getElementById('cryptoResult').style.display = 'block';
        
        showToast('✅ Đã giải mã tin nhắn!', 'success');
        
    } catch (error) {
        console.error('Error decrypting:', error);
        showToast('❌ Lỗi khi giải mã: ' + error.message, 'error');
    }
}

// Copy Export Content
function copyExportContent() {
    const text = document.getElementById('exportContent').textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Đã copy vào clipboard!', 'success');
    });
}

// Helper Functions for Advanced Features
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function generateSalt() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function simpleEncrypt(text, key) {
    // Simple XOR encryption for demo
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
}

function simpleDecrypt(encrypted, key) {
    const text = atob(encrypted);
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

function generateMnemonic(privateKey) {
    // Simplified mnemonic generation (for demo)
    // Trong production nên dùng BIP39 thư viện chuẩn
    const wordlist = [
        'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 
        'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 
        'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
        'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
        'advice', 'aerobic', 'afford', 'afraid', 'again', 'age', 'agent', 'agree',
        'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol'
    ];
    
    const words = [];
    let hash = privateKey;
    
    for (let i = 0; i < 12; i++) {
        const index = parseInt(hash.substr(i * 4, 4), 16) % wordlist.length;
        words.push(wordlist[index]);
    }
    
    return words.join(' ');
}

// Khôi phục Private Key từ Mnemonic
function mnemonicToPrivateKey(mnemonic) {
    // Simplified conversion (for demo)
    // Trong production nên dùng BIP39 thư viện chuẩn
    const wordlist = [
        'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 
        'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 
        'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
        'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
        'advice', 'aerobic', 'afford', 'afraid', 'again', 'age', 'agent', 'agree',
        'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol'
    ];
    
    const words = mnemonic.toLowerCase().trim().split(/\s+/);
    
    if (words.length !== 12) {
        throw new Error('Mnemonic phải có đúng 12 từ');
    }
    
    // Convert words to indices
    let privateKeyHex = '';
    for (let i = 0; i < words.length; i++) {
        const index = wordlist.indexOf(words[i]);
        if (index === -1) {
            throw new Error(`Từ "${words[i]}" không hợp lệ`);
        }
        // Convert index to hex and pad
        privateKeyHex += index.toString(16).padStart(4, '0');
    }
    
    // Pad to 64 characters if needed
    while (privateKeyHex.length < 64) {
        privateKeyHex += '0';
    }
    
    return privateKeyHex.substring(0, 64);
}

// Import Wallet from Mnemonic
function importFromMnemonic() {
    try {
        const mnemonic = document.getElementById('importMnemonic').value.trim();
        
        if (!mnemonic) {
            showToast('⚠️ Vui lòng nhập mnemonic phrase!', 'error');
            return;
        }
        
        // Convert mnemonic to private key
        const privateKey = mnemonicToPrivateKey(mnemonic);
        
        // Create wallet from private key
        const keyPair = ec.keyFromPrivate(privateKey, 'hex');
        const publicKey = keyPair.getPublic('hex');
        const address = deriveAddress(publicKey);
        
        // Save wallet
        currentWallet = {
            privateKey,
            publicKey,
            address,
            keyPair
        };
        
        // Sync với CLI
        cliWallet = currentWallet;
        
        // Hiển thị kết quả
        displayWalletInfo(privateKey, publicKey, address);
        
        // Hiển thị thông báo thành công
        document.getElementById('mnemonicImportResult').style.display = 'block';
        
        // Thông báo trong CLI
        addTerminalLine('✓ Wallet restored from mnemonic', 'success');
        addTerminalLine(`Address: ${address}`, 'output');
        
        showToast('✅ Khôi phục ví từ mnemonic thành công!', 'success');
        
        // Clear input
        document.getElementById('importMnemonic').value = '';
        
        // Hide result after 3 seconds
        setTimeout(() => {
            document.getElementById('mnemonicImportResult').style.display = 'none';
        }, 3000);
        
    } catch (error) {
        console.error('Error importing from mnemonic:', error);
        showToast('❌ Lỗi: ' + error.message, 'error');
    }
}

// Initialize - sync hash algorithms on page load
window.addEventListener('DOMContentLoaded', () => {
    // Sync hash algorithm selection between sign and verify
    const signHashSelect = document.getElementById('hashAlgorithm');
    const verifyHashSelect = document.getElementById('verifyHashAlgorithm');
    
    if (signHashSelect && verifyHashSelect) {
        signHashSelect.addEventListener('change', () => {
            verifyHashSelect.value = signHashSelect.value;
        });
    }
    
    // Setup CLI
    setupCLI();
});

/**
 * CLI (Command Line Interface) Implementation
 */
let cliWallet = null;
let cliHistory = [];

function setupCLI() {
    const input = document.getElementById('cliInput');
    if (!input) return;
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = input.value.trim();
            if (command) {
                executeCLICommand(command);
                cliHistory.push(command);
                input.value = '';
            }
        }
    });
}

function addTerminalLine(content, type = 'output') {
    const terminal = document.getElementById('terminalOutput');
    const line = document.createElement('div');
    line.className = 'terminal-line';
    
    if (type === 'command') {
        line.innerHTML = `<span class="prompt">$</span> <span class="terminal-command">${escapeHtml(content)}</span>`;
    } else if (type === 'error') {
        line.innerHTML = `<div class="terminal-error">${escapeHtml(content)}</div>`;
    } else if (type === 'success') {
        line.innerHTML = `<div class="terminal-success">${escapeHtml(content)}</div>`;
    } else {
        line.innerHTML = `<div class="terminal-output">${escapeHtml(content)}</div>`;
    }
    
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function executeCLICommand(command) {
    addTerminalLine(command, 'command');
    
    const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const cmd = parts[0]?.toLowerCase();
    const subCmd = parts[1]?.toLowerCase();
    
    try {
        if (cmd === 'wallet') {
            if (subCmd === 'generate') {
                cliGenerateWallet();
            } else if (subCmd === 'sign') {
                const message = parts.slice(2).join(' ').replace(/^"|"$/g, '');
                if (!message) {
                    addTerminalLine('Error: Please provide a message to sign', 'error');
                    addTerminalLine('Usage: wallet sign "Your message here"', 'output');
                    return;
                }
                cliSignMessage(message);
            } else if (subCmd === 'verify') {
                cliVerifyPrompt();
            } else if (subCmd === 'import') {
                const privateKey = parts[2]?.replace(/^"|"$/g, '');
                if (!privateKey) {
                    addTerminalLine('Error: Please provide a private key', 'error');
                    addTerminalLine('Usage: wallet import "your-private-key"', 'output');
                    return;
                }
                cliImportWallet(privateKey);
            } else if (subCmd === 'address') {
                cliShowAddress();
            } else if (subCmd === 'export') {
                cliExportWallet();
            } else if (subCmd === 'balance') {
                cliShowBalance();
            } else if (subCmd === 'mnemonic') {
                cliShowMnemonic();
            } else if (subCmd === 'restore') {
                const mnemonic = parts.slice(2).join(' ').replace(/^"|"/g, '');
                if (!mnemonic) {
                    addTerminalLine('Error: Please provide mnemonic phrase', 'error');
                    addTerminalLine('Usage: wallet restore "word1 word2 ... word12"', 'output');
                    return;
                }
                cliRestoreFromMnemonic(mnemonic);
            } else {
                addTerminalLine('Unknown wallet command. Type "help" for available commands.', 'error');
            }
        } else if (cmd === 'clear') {
            document.getElementById('terminalOutput').innerHTML = `
                <div class="terminal-line">
                    <span class="prompt">$</span> <span class="text-muted">Wallet CLI v1.0.0 - Type 'help' for commands</span>
                </div>
            `;
        } else if (cmd === 'help') {
            addTerminalLine('Available commands:', 'output');
            addTerminalLine('  wallet generate                     - Generate new wallet', 'output');
            addTerminalLine('  wallet sign "message"                - Sign a message', 'output');
            addTerminalLine('  wallet verify                       - Verify a signature', 'output');
            addTerminalLine('  wallet import "privateKey"          - Import existing wallet', 'output');
            addTerminalLine('  wallet address                      - Show current wallet address', 'output');
            addTerminalLine('  wallet export                       - Export wallet information', 'output');
            addTerminalLine('  wallet balance                      - Show wallet details', 'output');
            addTerminalLine('  wallet mnemonic                     - Show mnemonic phrase', 'output');
            addTerminalLine('  wallet restore "word1 word2 ..."    - Restore from mnemonic', 'output');
            addTerminalLine('  help                                - Show this help message', 'output');
            addTerminalLine('  clear                               - Clear terminal', 'output');
        } else {
            addTerminalLine(`Command not found: ${cmd}`, 'error');
            addTerminalLine('Type "help" for available commands.', 'output');
        }
    } catch (error) {
        addTerminalLine(`Error: ${error.message}`, 'error');
    }
}

function cliGenerateWallet() {
    addTerminalLine('Generating new wallet...', 'output');
    
    try {
        const keyPair = ec.genKeyPair();
        const privateKey = keyPair.getPrivate('hex');
        const publicKey = keyPair.getPublic('hex');
        const address = deriveAddress(publicKey);
        
        cliWallet = { privateKey, publicKey, address, keyPair };
        currentWallet = cliWallet; // Sync với GUI
        
        // Hiển thị trong GUI
        displayWalletInfo(privateKey, publicKey, address);
        
        addTerminalLine('✓ Wallet generated successfully!', 'success');
        addTerminalLine('', 'output');
        addTerminalLine(`Private Key: ${privateKey}`, 'output');
        addTerminalLine(`Public Key:  ${publicKey}`, 'output');
        addTerminalLine(`Address:     ${address}`, 'success');
        addTerminalLine('', 'output');
        addTerminalLine('⚠️  IMPORTANT: Save your private key securely!', 'error');
        
        showToast('✅ Ví đã được tạo (CLI)', 'success');
        
    } catch (error) {
        addTerminalLine(`Error generating wallet: ${error.message}`, 'error');
    }
}

function cliSignMessage(message) {
    if (!cliWallet) {
        addTerminalLine('Error: No wallet found. Generate or import a wallet first.', 'error');
        addTerminalLine('Use: wallet generate', 'output');
        return;
    }
    
    addTerminalLine(`Signing message: "${message}"`, 'output');
    
    try {
        // Try to parse as JSON, if fails use as plain text
        let messageToSign = message;
        try {
            const parsed = JSON.parse(message);
            messageToSign = JSON.stringify(parsed);
        } catch {
            // Not JSON, use as is
        }
        
        const hashAlgorithm = 'sha256'; // Default algorithm
        const messageHash = hashMessage(messageToSign, hashAlgorithm);
        const signature = cliWallet.keyPair.sign(messageHash);
        const signatureHex = signature.toDER('hex');
        
        // Sync với GUI - điền vào form
        document.getElementById('signPrivateKey').value = cliWallet.privateKey;
        document.getElementById('messageToSign').value = messageToSign;
        document.getElementById('signature').textContent = signatureHex;
        document.getElementById('signatureResult').style.display = 'block';
        
        addTerminalLine('✓ Message signed successfully!', 'success');
        addTerminalLine('', 'output');
        addTerminalLine(`Message Hash: ${messageHash}`, 'output');
        addTerminalLine(`Signature:    ${signatureHex}`, 'success');
        addTerminalLine(`Algorithm:    ${hashAlgorithm.toUpperCase()}`, 'output');
        
        // Add to history
        addToHistory('cli-sign', {
            message: messageToSign,
            signature: signatureHex,
            hashAlgorithm: hashAlgorithm
        });
        
        showToast('✅ Đã ký giao dịch (CLI)', 'success');
        
    } catch (error) {
        addTerminalLine(`Error signing message: ${error.message}`, 'error');
    }
}

function cliVerifyPrompt() {
    addTerminalLine('Verification requires:', 'output');
    addTerminalLine('  1. Public Key', 'output');
    addTerminalLine('  2. Original Message', 'output');
    addTerminalLine('  3. Signature', 'output');
    addTerminalLine('', 'output');
    addTerminalLine('Please use the GUI verification form above.', 'output');
}

function cliImportWallet(privateKey) {
    addTerminalLine('Importing wallet...', 'output');
    
    try {
        const keyPair = ec.keyFromPrivate(privateKey, 'hex');
        const publicKey = keyPair.getPublic('hex');
        const address = deriveAddress(publicKey);
        
        cliWallet = { privateKey, publicKey, address, keyPair };
        currentWallet = cliWallet; // Sync với GUI
        
        // Hiển thị trong GUI
        displayWalletInfo(privateKey, publicKey, address);
        
        addTerminalLine('✓ Wallet imported successfully!', 'success');
        addTerminalLine('', 'output');
        addTerminalLine(`Public Key:  ${publicKey}`, 'output');
        addTerminalLine(`Address:     ${address}`, 'success');
        
        showToast('✅ Import ví thành công (CLI)', 'success');
        
    } catch (error) {
        addTerminalLine('Error: Invalid private key', 'error');
    }
}

function cliShowAddress() {
    if (!cliWallet) {
        addTerminalLine('Error: No wallet found. Generate or import a wallet first.', 'error');
        return;
    }
    
    addTerminalLine('Current Wallet:', 'output');
    addTerminalLine(`Address: ${cliWallet.address}`, 'success');
    addTerminalLine(`Public Key: ${cliWallet.publicKey}`, 'output');
}

function cliExportWallet() {
    if (!cliWallet) {
        addTerminalLine('Error: No wallet found. Generate or import a wallet first.', 'error');
        return;
    }
    
    addTerminalLine('Wallet Export:', 'output');
    addTerminalLine('', 'output');
    addTerminalLine('⚠️  WARNING: Keep this information secure!', 'error');
    addTerminalLine('', 'output');
    addTerminalLine(`Private Key: ${cliWallet.privateKey}`, 'output');
    addTerminalLine(`Public Key:  ${cliWallet.publicKey}`, 'output');
    addTerminalLine(`Address:     ${cliWallet.address}`, 'success');
    addTerminalLine('', 'output');
    addTerminalLine('💡 Tip: Use GUI "Export Keystore" for encrypted backup', 'output');
}

function cliShowBalance() {
    if (!cliWallet) {
        addTerminalLine('Error: No wallet found. Generate or import a wallet first.', 'error');
        return;
    }
    
    addTerminalLine('Wallet Details:', 'output');
    addTerminalLine('', 'output');
    addTerminalLine(`📍 Address:     ${cliWallet.address}`, 'success');
    addTerminalLine(`🔑 Public Key:  ${cliWallet.publicKey.substring(0, 40)}...`, 'output');
    addTerminalLine(`🔐 Private Key: ${'*'.repeat(64)} (hidden)`, 'output');
    addTerminalLine('', 'output');
    addTerminalLine(`📊 Transaction History: ${transactionHistory.length} transactions`, 'output');
    addTerminalLine(`📅 Created: ${new Date().toLocaleString('vi-VN')}`, 'output');
    addTerminalLine('', 'output');
    addTerminalLine('💡 Note: This is a demo wallet for learning purposes', 'output');
}

function cliShowMnemonic() {
    if (!cliWallet) {
        addTerminalLine('Error: No wallet found. Generate or import a wallet first.', 'error');
        return;
    }
    
    const mnemonic = generateMnemonic(cliWallet.privateKey);
    
    addTerminalLine('Mnemonic Phrase (12 words):', 'output');
    addTerminalLine('', 'output');
    addTerminalLine(mnemonic, 'success');
    addTerminalLine('', 'output');
    addTerminalLine('⚠️  IMPORTANT: Write down these 12 words in order!', 'error');
    addTerminalLine('Keep them safe and never share with anyone.', 'output');
    addTerminalLine('', 'output');
    addTerminalLine('💡 You can restore your wallet using:', 'output');
    addTerminalLine('wallet restore "your 12 words here"', 'output');
}

function cliRestoreFromMnemonic(mnemonic) {
    addTerminalLine('Restoring wallet from mnemonic...', 'output');
    
    try {
        const privateKey = mnemonicToPrivateKey(mnemonic);
        const keyPair = ec.keyFromPrivate(privateKey, 'hex');
        const publicKey = keyPair.getPublic('hex');
        const address = deriveAddress(publicKey);
        
        cliWallet = { privateKey, publicKey, address, keyPair };
        currentWallet = cliWallet;
        
        displayWalletInfo(privateKey, publicKey, address);
        
        addTerminalLine('✓ Wallet restored successfully!', 'success');
        addTerminalLine('', 'output');
        addTerminalLine(`Address: ${address}`, 'success');
        addTerminalLine('', 'output');
        addTerminalLine('💡 Your wallet has been restored from the 12-word phrase', 'output');
        
        showToast('✅ Khôi phục ví từ mnemonic (CLI)', 'success');
        
    } catch (error) {
        addTerminalLine(`Error: ${error.message}`, 'error');
    }
}


