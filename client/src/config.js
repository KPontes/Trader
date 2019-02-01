const dev = {
  PORT: 3000,
  EXECUTER_URI: "http://localhost:7000"
};

const prod = {
  PORT: 3000,
  EXECUTER_URI: "http://ec2-3-89-212-171.compute-1.amazonaws.com:7000"
};

// Default to dev if not set
const config = process.env.REACT_APP_STAGE === "prod" ? prod : dev;

export default {
  // Add common config values here
  MAX_ATTACHMENT_SIZE: 5000000,
  ...config
};
