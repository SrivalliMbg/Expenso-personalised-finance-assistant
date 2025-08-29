from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import yfinance as yf
from app.database import get_user_data, add_user_data
import re
import os

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from flask import Blueprint

chatbot_bp = Blueprint("chatbot", __name__)
app = Flask(__name__)
CORS(app)

# ---------------- GPU + Model Setup ---------------- #
# NOTE: Uses your Hugging Face token. Consider moving this to an env var in production.
model_id = "google/gemma-2b-it"
hf_token = "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"

# Device info
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[Init] Torch CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    try:
        print(f"[Init] CUDA device: {torch.cuda.get_device_name(0)}")
    except Exception:
        pass
print(f"[Init] Using device: {device}")

# Tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_id, token=hf_token)

# Quantization config (matches your original approach)
bnb_config = BitsAndBytesConfig(
    load_in_8bit=True,                 # 8-bit weights on GPU for faster inference
    bnb_4bit_use_double_quant=True,    # kept from your code (harmless with 8-bit)
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16
)

# Model (Accelerate will place it on GPU if available via device_map="auto")
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    device_map="auto",
    quantization_config=bnb_config,
    token=hf_token
)

# ---------------- Rule-Based + Helpers ---------------- #
def get_user_financial_summary(user_id, profile_data, chat_history):
    """
    Retrieves and summarizes the user's financial data, profile, and chat history.
    """
    user_data = get_user_data(user_id)
    summary = ""

    # Profile
    if profile_data:
        summary += "User Profile:\n"
        for key, value in profile_data.items():
            summary += f"- {key}: {value}\n"

    # Uploads
    if user_data:
        bank_data = user_data.get('bank_account', pd.DataFrame())
        credit_data = user_data.get('credit_card', pd.DataFrame())

        if not bank_data.empty:
            total_expenses = bank_data[bank_data['Amount'] < 0]['Amount'].sum()
            total_income   = bank_data[bank_data['Amount'] > 0]['Amount'].sum()
            summary += (
                "Bank Account Summary:\n"
                f"- Total Expenses: ₹{-float(total_expenses):.2f}\n"
                f"- Total Income: ₹{float(total_income):.2f}\n"
            )

        if not credit_data.empty:
            total_credit_spending = credit_data[credit_data['Amount'] < 0]['Amount'].sum()
            summary += f"Credit Card Summary:\n- Total Spending: ₹{-float(total_credit_spending):.2f}\n"

    # Chat history
    if chat_history:
        summary += "Chat History:\n"
        for msg in chat_history:
            summary += f"- {msg['sender']}: {msg['text']}\n"

    return summary.strip()


def analyze_budget(user_id):
    """
    Budget summary from both bank + credit card data (income, expenses, savings, breakdown).
    Always returns a dict with 'summary' and 'data'.
    """
    user_data = get_user_data(user_id)
    if not user_data:
        return {"summary": "No financial data has been uploaded.", "data": []}

    bank_data   = user_data.get('bank_account', pd.DataFrame())
    credit_data = user_data.get('credit_card', pd.DataFrame())

    # Combine transactions
    frames = []
    if not bank_data.empty:
        frames.append(bank_data)
    if not credit_data.empty:
        frames.append(credit_data)
    all_data = pd.concat(frames) if frames else pd.DataFrame()

    if all_data.empty:
        return {"summary": "No financial data available for budget analysis.", "data": []}

    # Spending by category (negative = spend)
    spending_only = all_data[all_data['Amount'] < 0].copy()
    if spending_only.empty:
        total_income = all_data[all_data['Amount'] > 0]['Amount'].sum()
        return {"summary": f"No expenses found. Total Income: ₹{float(total_income):.2f}", "data": []}

    spending_by_category = spending_only.groupby('Category', dropna=False)['Amount'].sum().reset_index()
    spending_by_category['Amount'] = spending_by_category['Amount'].abs()

    total_expenses = float(spending_by_category['Amount'].sum())
    total_income   = float(all_data[all_data['Amount'] > 0]['Amount'].sum())
    net_savings    = total_income - total_expenses

    spending_by_category['Percentage'] = (spending_by_category['Amount'] / total_expenses) * 100.0

    summary = (
        "Your budget summary:\n"
        f"- Total Income: ₹{total_income:.2f}\n"
        f"- Total Expenses: ₹{total_expenses:.2f}\n"
        f"- Net Savings: ₹{net_savings:.2f}\n"
    )

    return {"summary": summary, "data": spending_by_category.to_dict('records')}


def analyze_insights(user_id):
    """
    Insights & suggestions from combined transactions.
    """
    user_data = get_user_data(user_id)
    if not user_data:
        return "No financial data uploaded yet."

    bank_data   = user_data.get('bank_account', pd.DataFrame())
    credit_data = user_data.get('credit_card', pd.DataFrame())

    frames = []
    if not bank_data.empty:
        frames.append(bank_data)
    if not credit_data.empty:
        frames.append(credit_data)
    all_data = pd.concat(frames) if frames else pd.DataFrame()

    if all_data.empty:
        return "No transactions available for insights."

    spending_only = all_data[all_data['Amount'] < 0]
    if spending_only.empty:
        return "No expenses found for insights."

    group = spending_only.groupby('Category')['Amount'].sum()
    top_category = group.idxmin()   # most negative sum => highest spend
    top_amount   = -float(group.min())

    return (
        f"Your highest spending category is *{top_category}* with total spending of ₹{top_amount:.2f}. "
        "Consider reducing discretionary expenses in this category."
    )


# ---- Stocks: Indian tickers under a given price (₹). Real prices via yfinance. ---- #
CANDIDATE_TICKERS = [
    "YESBANK.NS", "SUZLON.NS", "IDEA.NS", "NHPC.NS", "IOC.NS",
    "PNB.NS", "SOUTHBANK.NS", "UCOBANK.NS", "SAIL.NS", "GAIL.NS",
    "ONGC.NS", "COALINDIA.NS", "BHEL.NS", "BANKBARODA.NS", "ZEEL.NS",
    "CANBK.NS", "UNIONBANK.NS", "IDFCFIRSTB.NS", "NLCINDIA.NS", "NBCC.NS"
]

def get_top_stocks_under(price_limit=500, count=10):
    """
    Returns up to count Indian tickers with current price <= price_limit.
    """
    results = []
    for t in CANDIDATE_TICKERS:
        try:
            price = yf.Ticker(t).history(period="1d")['Close'].iloc[-1]
            if price <= price_limit:
                results.append({"ticker": t, "price": round(price, 2)})
        except Exception:
            continue

    results.sort(key=lambda x: x["price"])
    return results[:count]


def parse_stock_request(message: str):
    """
    Extract desired count and price limit from message.
    Defaults: count=10, price_limit=500 (₹).
    """
    msg = message.lower()
    # count: e.g., "give 5 stocks", "top 7 stocks", "suggest 3 ..."
    m_count = re.search(r'\b(?:top|give|suggest|list)\s+(\d+)\b', msg)
    count = int(m_count.group(1)) if m_count else 10

    # price: e.g., "under 100", "below 250"
    m_price = re.search(r'\b(?:under|below|<=?)\s*(\d+)', msg)
    price_limit = int(m_price.group(1)) if m_price else 500

    return count, price_limit


def looks_like_stock_query(message: str) -> bool:
    msg = message.lower()
    return ("stock" in msg or "stocks" in msg) and ("under" in msg or "below" in msg or re.search(r'\b\d+\b', msg))


# ---- Model response (Student/Professional) with structured output ---- #
def generate_ai_response(user_message, context_data, user_mode):
    """
    Generates an AI response using the local model, incorporating all available data.
    - Keeps max_new_tokens=250 and do_sample=False (your original settings).
    - Enforces structured list formatting.
    - Intercepts stock queries and answers from yfinance directly.
    """
    # Student vs Professional tone (kept simple & clear)
    if user_mode == 'professional':
        tone_prompt = "You are a professional financial advisor. Provide detailed, well-structured guidance using appropriate financial terminology."
    else:
        tone_prompt = "You are a friendly and encouraging financial tutor. Keep explanations simple, actionable, and easy to understand."

    # Intercept stock queries → answer from data, not the LLM
    if looks_like_stock_query(user_message):
        count, price_limit = parse_stock_request(user_message)
        stocks = get_top_stocks_under(price_limit=price_limit, count=count)
        if not stocks:
            return f"I'm sorry, I could not find any Indian stocks under ₹{price_limit} right now."
        lines = [f"Here are {min(count, len(stocks))} Indian stocks under ₹{price_limit}:"]
        for i, s in enumerate(stocks, 1):
            lines.append(f"{i}. {s['ticker']} — Current Price: ₹{s['price']}")
        return "\n".join(lines)

    # Otherwise use the model
    full_prompt = (
        f"System: {tone_prompt}\n"
        "Rules:\n"
        "• ALWAYS answer as a numbered or bulleted list (no long paragraphs).\n"
        "• Base your advice ONLY on the provided context; do not invent data.\n"
        "• If giving budget advice, be specific and actionable.\n"
        "• Keep answers concise and clear.\n"
        f"Context:\n{context_data}\n"
        f"User's Question: {user_message}\n"
        "Answer:"
    )

    # Ensure tensors go to the same device as the model
    input_ids = tokenizer(full_prompt, return_tensors="pt").to(model.device)

    try:
        outputs = model.generate(
            **input_ids,
            max_new_tokens=250,      # <-- kept EXACTLY as in your code
            num_return_sequences=1,
            do_sample=False          # <-- deterministic for accuracy/format
        )
        decoded_output = tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Extract after the "Answer:" marker and clean
        response_start_marker = "Answer:"
        bot_response = decoded_output.split(response_start_marker)[-1].strip()
        bot_response = re.sub(r'System: .*', '', bot_response, flags=re.DOTALL).strip()

        # Final safety: if the model still returns a big paragraph, add simple list bullets
        if "\n" not in bot_response:
            bot_response = "- " + bot_response

        return bot_response
    except Exception as e:
        return f"Sorry, I'm having trouble with my AI service. Error: {e}"


# ---------------- API Endpoints ---------------- #
@app.route('/api/upload_data', methods=['POST'])
def upload_data():
    data = request.json
    user_id    = data.get('user_id')
    bank_data  = data.get('bank_account')
    credit_data = data.get('credit_card')

    if not user_id:
        return jsonify({"message": "User ID is required."}), 400

    if bank_data:
        df_bank = pd.DataFrame(bank_data)
        add_user_data(user_id, 'bank_account', df_bank)

    if credit_data:
        df_credit = pd.DataFrame(credit_data)
        add_user_data(user_id, 'credit_card', df_credit)

    return jsonify({"message": "Financial data uploaded successfully!"})


@app.route('/api/guidance', methods=['POST'])
def get_guidance():
    data = request.json
    user_id      = data.get('user_id')
    user_message = data.get('message', 'Provide general financial guidance.')
    user_mode    = data.get('user_mode', 'student')
    profile_data = data.get('profile_data', {})
    chat_history = data.get('chat_history', [])

    summary  = get_user_financial_summary(user_id, profile_data, chat_history)
    response = generate_ai_response(user_message, summary, user_mode)
    return jsonify({"response": response})


@app.route('/api/budget', methods=['POST'])
def get_budget():
    data = request.json
    user_id      = data.get('user_id')
    user_mode    = data.get('user_mode', 'student')
    profile_data = data.get('profile_data', {})
    chat_history = data.get('chat_history', [])

    budget_analysis = analyze_budget(user_id)
    context_data    = get_user_financial_summary(user_id, profile_data, chat_history)

    # Ask the LLM to produce a tidy bullets/numbered summary using the budget data as context
    ai_response = generate_ai_response(
        "Summarize my budget and highlight 3 key actions to improve savings.",
        f"{context_data}\n\nSpending by category data:\n{budget_analysis['data']}",
        user_mode
    )

    return jsonify({"response": ai_response, "chart_data": budget_analysis['data'], "summary": budget_analysis['summary']})


@app.route('/api/insights', methods=['POST'])
def get_insights():
    data = request.json
    user_id      = data.get('user_id')
    user_mode    = data.get('user_mode', 'student')
    profile_data = data.get('profile_data', {})
    chat_history = data.get('chat_history', [])

    insights     = analyze_insights(user_id)
    context_data = get_user_financial_summary(user_id, profile_data, chat_history)

    response = generate_ai_response(
        f"Provide spending insights. Here is the main insight: {insights}",
        f"{context_data}\n\n{insights}",
        user_mode
    )

    return jsonify({"response": response})


@app.route('/api/chatbot', methods=['POST'])
def chatbot_response():
    data = request.json
    user_id      = data.get('user_id')
    user_message = data.get('message')
    user_mode    = data.get('user_mode', 'student')
    profile_data = data.get('profile_data', {})
    chat_history = data.get('chat_history', [])

    if not user_id or not user_message:
        return jsonify({"response": "Please provide a user ID and a message."}), 400

    financial_summary = get_user_financial_summary(user_id, profile_data, chat_history)
    context_data = financial_summary if financial_summary else (
        "Chat History:\n" + "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history])
    )

    bot_response = generate_ai_response(user_message, context_data, user_mode)
    return jsonify({"response": bot_response})


if __name__ == '__main__':
    app.run(debug=True, port=5000)