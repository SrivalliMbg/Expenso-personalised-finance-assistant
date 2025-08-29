function createPolicyCard(company, number, premium, expiry) {
  const card = document.createElement('div');
  card.className = 'policy-card';
  card.innerHTML = `
    <h4>${company}</h4>
    <p>Policy No: ${number}</p>
    <p>Premium: ₹${premium}</p>
    <p>Expiry: ${expiry}</p>
  `;
  return card;
}

function showPolicyInput(containerId) {
  const container = document.getElementById(containerId);
  const inputCard = document.createElement('div');
  inputCard.className = 'policy-card';
  inputCard.innerHTML = `
    <input type="text" placeholder="Company" class="company-input"><br>
    <input type="text" placeholder="Policy Number" class="number-input"><br>
    <input type="number" placeholder="Premium" class="premium-input"><br>
    <input type="text" placeholder="Expiry Date" class="expiry-input"><br>
    <button class="save-btn">Save</button>
  `;
  container.appendChild(inputCard);

  inputCard.querySelector('.save-btn').onclick = function() {
    const company = inputCard.querySelector('.company-input').value;
    const number = inputCard.querySelector('.number-input').value;
    const premium = inputCard.querySelector('.premium-input').value;
    const expiry = inputCard.querySelector('.expiry-input').value;
    inputCard.replaceWith(createPolicyCard(company, number, premium, expiry));
  };
}

function loadInsurance() {
  const root = document.getElementById('root');
  if (!root) return;
  
  root.innerHTML = `
    <div class="insurance-section">
      <div class="insurance-section-header">
        <h3>Health Insurance</h3>
        <button class="add-btn" onclick="showPolicyInput('health-insurance')">+</button>
      </div>
      <div id="health-insurance" class="insurance-container"></div>
    </div>
    <div class="insurance-section">
      <div class="insurance-section-header">
        <h3>Life Insurance</h3>
        <button class="add-btn" onclick="showPolicyInput('life-insurance')">+</button>
      </div>
      <div id="life-insurance" class="insurance-container"></div>
    </div>
    <div class="insurance-section">
      <div class="insurance-section-header">
        <h3>Vehicle Insurance</h3>
        <button class="add-btn" onclick="showPolicyInput('vehicle-insurance')">+</button>
      </div>
      <div id="vehicle-insurance" class="insurance-container"></div>
    </div>
  `;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('Insurance page loaded');
  loadInsurance();
});
