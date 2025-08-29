// Accounts Frontend JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Accounts page loaded');
    
    // Initialize accounts functionality
    initAccounts();
});

function initAccounts() {
    // Add your accounts-specific JavaScript functionality here
    console.log('Initializing accounts functionality');
    
    // Example: Load user's accounts
    loadUserAccounts();
}

function loadUserAccounts() {
    // Empty data - replace with actual API call later
    const mockAccountsData = [];
    
    console.log('Accounts data:', mockAccountsData);
    renderAccounts(mockAccountsData);
}

function renderAccounts(accountsData) {
    console.log('Rendering accounts with data:', accountsData);
    const root = document.getElementById('root');
    if (!root) {
        console.error('Root element not found!');
        return;
    }
    console.log('Root element found, rendering content...');
    
    // Create accounts UI with better styling
    root.innerHTML = `
        <div class="accounts-container">
            <div class="page-header">
                <h1>My Accounts</h1>
                <p>Manage your bank accounts and financial institutions</p>
            </div>
            
            <div class="accounts-overview">
                <div class="overview-card">
                    <h3>Total Balance</h3>
                    <p class="balance-amount">₹${accountsData.reduce((sum, acc) => sum + (acc.balance || 0), 0).toLocaleString()}</p>
                </div>
                <div class="overview-card">
                    <h3>Total Accounts</h3>
                    <p class="account-count">${accountsData.length}</p>
                </div>
            </div>
            
            <div class="accounts-section">
                <div class="section-header">
                    <h2>Your Accounts</h2>
                    <button class="add-btn" onclick="showAddAccountForm()">+</button>
                </div>
                
                <div class="accounts-grid">
                    ${accountsData.length > 0 ? accountsData.map(account => `
                        <div class="account-card">
                            <div class="account-header">
                                <div class="account-icon ${account.type}"></div>
                                <div class="account-info">
                                    <h3>${account.name}</h3>
                                    <p class="account-type">${account.type.charAt(0).toUpperCase() + account.type.slice(1)} Account</p>
                                </div>
                            </div>
                            <div class="account-details">
                                <p><strong>Bank:</strong> ${account.bank}</p>
                                <p><strong>Account:</strong> ****${account.lastFour}</p>
                                <p class="account-balance"><strong>Balance:</strong> <span class="${account.balance < 0 ? 'negative-balance' : 'positive-balance'}">₹${Math.abs(account.balance).toLocaleString()}</span></p>
                            </div>
                            <div class="account-actions">
                                <button class="action-btn">View Details</button>
                                <button class="action-btn">Edit</button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">🏦</div>
                            <h3>No Accounts Yet</h3>
                            <p>Add your first bank account to get started</p>
                            <button class="add-btn" onclick="showAddAccountForm()">+</button>
                        </div>
                    `}
                </div>
            </div>
            
            <div id="addAccountModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Add New Account</h2>
                        <span class="close" onclick="closeAddAccountForm()">&times;</span>
                    </div>
                    <form id="addAccountForm">
                        <div class="form-group">
                            <label for="accountName">Account Name</label>
                            <input type="text" id="accountName" placeholder="e.g., Main Savings Account" required>
                        </div>
                        <div class="form-group">
                            <label for="accountType">Account Type</label>
                                                         <select id="accountType" required>
                                 <option value="">Select Account Type</option>
                                 <optgroup label="Bank Accounts">
                                     <option value="savings">Savings Account</option>
                                     <option value="current">Current/Checking Account</option>
                                     <option value="fixed_deposit">Fixed Deposit</option>
                                     <option value="recurring_deposit">Recurring Deposit</option>
                                 </optgroup>
                                 <optgroup label="Credit & Loans">
                                     <option value="credit">Credit Card</option>
                                     <option value="personal_loan">Personal Loan</option>
                                     <option value="home_loan">Home Loan</option>
                                     <option value="vehicle_loan">Vehicle Loan</option>
                                     <option value="business_loan">Business Loan</option>
                                 </optgroup>
                                 <optgroup label="Digital">
                                     <option value="upi">UPI App</option>
                                     <option value="digital_wallet">Digital Wallet</option>
                                     <option value="gift_card">Gift Card</option>
                                 </optgroup>
                             </select>
                        </div>
                        <div class="form-group">
                            <label for="bankName">Bank Name</label>
                            <input type="text" id="bankName" placeholder="e.g., HDFC Bank" required>
                        </div>
                        <div class="form-group">
                            <label for="balance">Current Balance</label>
                            <input type="number" id="balance" placeholder="0.00" step="0.01" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="cancel-btn" onclick="closeAddAccountForm()">Cancel</button>
                            <button type="submit" class="submit-btn">Add Account</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Add event listener for the form
    const form = document.getElementById('addAccountForm');
    if (form) {
        form.addEventListener('submit', handleAddAccount);
    }
}

function handleAddAccount(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('accountName').value,
        type: document.getElementById('accountType').value,
        bank: document.getElementById('bankName').value,
        balance: parseFloat(document.getElementById('balance').value)
    };
    
    // Send new account data to backend
    fetch('/api/accounts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Account added:', data);
        // Reload accounts to show the new one
        loadUserAccounts();
        // Reset form
        event.target.reset();
    })
    .catch(error => {
        console.error('Error adding account:', error);
    });
}

// Modal functions
function showAddAccountForm() {
    document.getElementById('addAccountModal').style.display = 'block';
}

function closeAddAccountForm() {
    document.getElementById('addAccountModal').style.display = 'none';
    document.getElementById('addAccountForm').reset();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addAccountModal');
    if (event.target === modal) {
        closeAddAccountForm();
    }
}
