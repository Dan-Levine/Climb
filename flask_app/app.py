from flask import Flask, render_template


def create_app():
    """Factory to create and configure the Flask application."""
    app = Flask(__name__, static_folder='static', template_folder='templates')

    @app.route('/')
    def index():
        # Render the main game page
        return render_template('index.html')

    return app


if __name__ == '__main__':
    # Create the app and run in debug mode for development
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
