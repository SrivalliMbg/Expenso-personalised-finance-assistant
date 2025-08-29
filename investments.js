function createInvestmentCard(name, type, amount, returnRate) {
  const card = document.createElement('div');
  card.className = 'investment-card';
  card.innerHTML = `
    <h4>${name}</h4>
    <p>Type: ${type}</p>
    <p>Amount: ₹${amount}</p>
    <p>Return: ${returnRate}%</p>
  `;
  return card;
}

function showInvestmentInput(containerId) {
  const container = document.getElementById(containerId);
  const inputCard = document.createElement('div');
  inputCard.className = 'investment-card';
  inputCard.innerHTML = `
    <input type="text" placeholder="Investment Name" class="name-input"><br>
    <input type="text" placeholder="Type" class="type-input"><br>
    <input type="number" placeholder="Amount" class="amount-input"><br>
    <input type="number" placeholder="Return Rate (%)" class="return-input"><br>
    <button class="save-btn">Save</button>
  `;
  container.appendChild(inputCard);

  inputCard.querySelector('.save-btn').onclick = function() {
    const name = inputCard.querySelector('.name-input').value;
    const type = inputCard.querySelector('.type-input').value;
    const amount = inputCard.querySelector('.amount-input').value;
    const returnRate = inputCard.querySelector('.return-input').value;
    inputCard.replaceWith(createInvestmentCard(name, type, amount, returnRate));
  };
}

function loadInvestments() {
  const root = document.getElementById('root');
  if (!root) return;
  
  root.innerHTML = `
    <div class="investment-section">
      <div class="investment-section-header">
        <h3>Stocks</h3>
        <button class="add-btn" onclick="showInvestmentInput('stocks')">+</button>
      </div>
      <div id="stocks" class="investment-container"></div>
    </div>
    <div class="investment-section">
      <div class="investment-section-header">
        <h3>Mutual Funds</h3>
        <button class="add-btn" onclick="showInvestmentInput('mutual-funds')">+</button>
      </div>
      <div id="mutual-funds" class="investment-container"></div>
    </div>
    <div class="investment-section">
      <div class="investment-section-header">
        <h3>Fixed Deposits</h3>
        <button class="add-btn" onclick="showInvestmentInput('fixed-deposits')">+</button>
      </div>
      <div id="fixed-deposits" class="investment-container"></div>
    </div>
  `;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('Investments page loaded');
  loadInvestments();
});
