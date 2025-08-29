from flask import Blueprint, request, jsonify, render_template, current_app
from werkzeug.security import generate_password_hash, check_password_hash

# ---------------- Blueprints ---------------- #
main = Blueprint("main", __name__)
chatbot_bp = Blueprint("chatbot_bp", __name__)

# -------------------- Render Pages -------------------- #

@main.route("/")
def home():
    return render_template("home.html")  # Dashboard page

@main.route("/dashboard")
def dashboard():
    return render_template("home.html")

@main.route("/login_page")
def login_page():
    return render_template("login.html")

@main.route("/register_page")
def register_page():
    return render_template("register.html")

@main.route("/profile_page")
def profile_page():
    return render_template("profile.html")

@main.route("/accounts_page")
def accounts_page():
    return render_template("accounts.html", username="User")

@main.route("/expenses_page")
def expenses_page():
    return render_template("expenses.html", username="User")

@main.route("/cards_page")
def cards_page():
    return render_template("cards.html", username="User")

@main.route("/insurance_page")
def insurance_page():
    return render_template("insurance.html", username="User")

@main.route("/investments_page")
def investments_page():
    return render_template("investments.html", username="User")

@main.route("/recent_page")
def recent_page():
    return render_template("transactions.html", username="User")

@main.route("/transactions_page")
def transactions_page():
    return render_template("transactions.html", username="User")

@main.route("/logout_page")
def logout_page():
    return render_template("logout.html")

@main.route("/logout")
def logout():
    # Clear session and redirect to login
    return jsonify({"message": "Logged out successfully"}), 200

@main.route("/error_page")
def error_page():
    return render_template("error.html")

# -------------------- User Registration -------------------- #

@main.route("/register", methods=["POST"], endpoint="register_post")
def register():
    if not current_app.mysql:
        return jsonify({"message": "Database not available. Please check your database connection."}), 503
    
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    status = data.get("status", "professional")
    dob = data.get("dob")
    phone = data.get("phone")
    profession = data.get("profession")

    hashed_password = generate_password_hash(password)

    try:
        cursor = current_app.mysql.cursor()
        cursor.execute(
            """INSERT INTO users (username, email, password, status, dob, phone, profession)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (username, email, hashed_password, status, dob, phone, profession)
        )
        current_app.mysql.commit()
        cursor.close()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

# -------------------- User Login -------------------- #

@main.route("/login", methods=["POST"])
def login():
    if not current_app.mysql:
        return jsonify({"message": "Database not available. Please check your database connection."}), 503
    
    data = request.json
    username = data.get("username")
    password = data.get("password")

    try:
        cursor = current_app.mysql.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
        user = cursor.fetchone()
        cursor.close()

        if user and check_password_hash(user["password"], password):
            user.pop("password")  # remove sensitive info
            return jsonify({"message": "Login successful", "user": user}), 200
        else:
            return jsonify({"message": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

# -------------------- Optional: Fetch All Users -------------------- #

@main.route("/users", methods=["GET"])
def get_users():
    try:
        cursor = current_app.mysql.cursor(dictionary=True)
        cursor.execute(
            """SELECT id, username, email, status, dob, phone, profession, created_at
               FROM users"""
        )
        users = cursor.fetchall()
        cursor.close()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

# ---------------- API Endpoints (Chatbot & AI Features) ---------------- #

@chatbot_bp.route('/api/upload_data', methods=['POST'])
def upload_data():
    # TODO: implement your logic
    return jsonify({"message": "Data uploaded successfully"}), 200

@chatbot_bp.route('/api/guidance', methods=['POST'])
def get_guidance():
    # TODO: implement your AI career guidance logic
    return jsonify({"guidance": "Sample career advice"}), 200

@chatbot_bp.route('/api/budget', methods=['POST'])
def get_budget():
    # TODO: implement your budget planning logic
    return jsonify({"budget": "Sample budget insights"}), 200

@chatbot_bp.route('/api/insights', methods=['POST'])
def get_insights():
    # TODO: implement AI insights logic
    return jsonify({"insights": "Sample financial insights"}), 200

@chatbot_bp.route('/api/chatbot', methods=['POST'])
def chatbot_response():
    # TODO: implement chatbot response logic
    data = request.json
    user_message = data.get("message", "")
    return jsonify({"response": f"You said: {user_message}"}), 200
