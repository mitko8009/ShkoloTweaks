from server import run_server
from utils import *

if __name__ == '__main__':
    Config().load() # Preload config to ensure it's valid
    db() # Initialize database connection
    run_server()