// Card creation
function createCard(bname, name, number, expiry) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-bname">${bname}</div>
    <div class="card-number">${formatCardNumber(number)}</div>
    <div class="card-footer">
      <span class="card-name">${name}</span>
      <span class="card-expiry">${expiry}</span>
    </div>
  `;
  return card;
}

function formatCardNumber(number) {
  number = number.replace(/\s+/g, '');
  if (number.length < 16) return number;
  return number.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, "$1 **** **** $4");
}

function loadCards() {
  const root = document.getElementById('root');
  if (!root) return;
  
  root.innerHTML = `
    <div class="card-section">
      <div class="card-section-header">
        <h3>Debit Cards</h3>
        <button id="add-debit-btn" class="add-btn" title="Add Debit Card">+</button>
      </div>
      <div id="debit-cards" class="card-container"></div>
    </div>
    <div class="card-section">
      <div class="card-section-header">
        <h3>Credit Cards</h3>
        <button id="add-credit-btn" class="add-btn" title="Add Credit Card">+</button>
      </div>
      <div id="credit-cards" class="card-container"></div>
    </div>
    <div class="card-section">
      <div class="card-section-header">
        <h3>Prepaid Cards</h3>
        <button id="add-prepaid-btn" class="add-btn" title="Add Prepaid Card">+</button>
      </div>
      <div id="prepaid-cards" class="card-container"></div>
    </div>
  `;

  // Add card input logic
  document.getElementById('add-debit-btn').onclick = () => showCardInput('debit-cards');
  document.getElementById('add-credit-btn').onclick = () => showCardInput('credit-cards');
  document.getElementById('add-prepaid-btn').onclick = () => showCardInput('prepaid-cards');
}

// Show input form for new card
function showCardInput(containerId) {
  const container = document.getElementById(containerId);
  const card = document.createElement('div');
  card.className = 'card card-input';
  card.innerHTML = `
    <span>Bank Name: <input type="text" class="bname-input" placeholder="Bank Name"></span><br>
    <span>Name: <input type="text" class="name-input" placeholder="Cardholder Name"></span><br>
    <span>Card No: <input type="text" class="number-input" placeholder="Card Number"></span><br>
    <span>Expiry: <input type="text" class="expiry-input" placeholder="MM/YY"></span><br>
    <button class="save-btn">Save</button>
  `;
  container.appendChild(card);

  card.querySelector('.save-btn').onclick = function() {
    const bname = card.querySelector('.bname-input').value;
    const name = card.querySelector('.name-input').value;
    const number = card.querySelector('.number-input').value;
    const expiry = card.querySelector('.expiry-input').value;
    card.replaceWith(createCard(bname, name, number, expiry));
  };
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('Cards page loaded');
  loadCards();
});
