from server import run_server
from utils import *



if __name__ == '__main__':
    Config().load()
    db()
    run_server()