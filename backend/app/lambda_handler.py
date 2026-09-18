from mangum import Mangum
from app.local_server import app

handler = Mangum(app, lifespan="off")
