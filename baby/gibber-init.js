Gibber.init();
Gibber.Environment = {
  SERVER_URL: location.protocol + '//' + location.host
};
Gibber.log = function(arg) {
  console.log(arg);
};