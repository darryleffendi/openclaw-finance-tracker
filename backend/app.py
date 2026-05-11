from flask import Flask
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from backend.auth import init_oauth
from backend.config import CORS_ORIGINS, PORT, SECRET_KEY
from backend.routes import accounts, auth, distribute, summary, transactions

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
app.secret_key = SECRET_KEY
CORS(app, origins=CORS_ORIGINS, supports_credentials=True)

init_oauth(app)

app.register_blueprint(auth.bp)
app.register_blueprint(transactions.bp)
app.register_blueprint(accounts.bp)
app.register_blueprint(summary.bp)
app.register_blueprint(distribute.bp)


if __name__ == "__main__":
    app.run(port=PORT, debug=False)
