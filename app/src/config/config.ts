export default function config(): AppConfig {
  switch (process.env.NODE_ENV) {
    case 'production':
      return configProd;
    case 'development':
      return configDev;
    default:
      throw new Error('NODE_ENV not set');
  }
}

interface AppConfig {
  BACKEND_URI: string;
}

const configProd = {
  BACKEND_URI: 'https://us-central1-driven-utility-202807.cloudfunctions.net'
}

const configDev = {
  BACKEND_URI: 'http://localhost:5001/driven-utility-202807/us-central1'
}
