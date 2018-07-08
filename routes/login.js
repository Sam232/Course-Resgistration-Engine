const router = require("express").Router();
const jwt = require("jsonwebtoken");
const Mailgun = require("mailgun-js");
const validator = require("email-validator");
const generatePassword = require("generate-password");
const bcrypt = require("bcrypt");

const AdminPD = require("../models/AdminPD");
const LecturerPD = require("../models/LecturerPD");
const FinancePD = require("../models/FinancePD");
const StudentPD = require("../models/StudentPD");
const StudentLogin = require("../models/StudentLogin");
const Login = require("../models/Login");

const {EmailAPI} = require("../config/EmailAPI");

//Verify LinkID
router.get("/verify/:linkId", (req, res) => {
  var linkId = req.params.linkId;

  LecturerPD.findOne({
    linkId
  }).then((result) => {
    if(result){
      return res.status(200).json({
        verifyState: "Correct LinkId"
      });
    }
    FinancePD.findOne({
      linkId
    }).then((result) => {
      if(result){
        return res.status(200).json({
          verifyState: "Correct LinkId"
        });
      }
      AdminPD.findOne({
        linkId
      }).then((result) => {
        if(result){
          return res.status(200).json({
            verifyState: "Correct LinkId"
          });
        }        
        res.status(404).json({
          verifyState: "Incorrect LinkId"
        });      
      })
      .catch((err) => {
        if(err){
          res.status(404).json({
            err,
            errorMsg: "An Error Occured, Try Again"
          });
        }
      });      
    })
    .catch((err) => {
      if(err){
        res.status(404).json({
          err,
          errorMsg: "An Error Occured, Try Again"
        });
      }
    });
  })
  .catch((err) => {
    if(err){
      res.status(404).json({
        err,
        errorMsg: "An Error Occured, Try Again"
      });
    }
  });
});

//Login Auth For Lecturers, Financial Accountant And Admin
router.post("/:linkId", (req, res) => {
  var email = req.body.email;
  var linkId = req.params.linkId;

  if(!validator.validate(email)){
    return res.status(404).json({
      errorMsg: "A Valid Email Address Is Required"
    });
  }

  LecturerPD.findOne({
    email,
    linkId
  }).then((lecturerDetails) => {
    if(lecturerDetails){
      lecturerDetails.password = generatePassword.generate({
        length: 10,
        numbers: true,
        symbols: true
      });

      return bcrypt.hash(lecturerDetails.password, 10).then((hash) => {
        if(hash){
          return new Login({
            role: lecturerDetails.role,
            password: hash
          }).save().then((newLoginDetails) => {
            if(newLoginDetails){
              var userDetails = {
                user: lecturerDetails,
                password: lecturerDetails.password,
                queryId: newLoginDetails._id
              };
              return jwt.sign({userDetails}, "secretKey", {expiresIn: "24h"}, (err, token) => {
                if(err){
                  return res.status(404).json({
                    errorMsg: "An Error Occured, Try Again"
                  });
                }
    
                var message = `Dear ${lecturerDetails.firstName}, you can login to GTUC COURSE-REG using this <a href=http://localhost:5000/lecturer/welcome/${token}>LOGIN LINK</a>. Please note that, this link is valid for only 24 hours and also becomes inactive after you logout from the application.`;
                
                EmailAPI(Mailgun, lecturerDetails, message).then((sent) => {
                  if(sent){
                    return res.status(200).json({
                      user: {
                        details: userDetails.user,
                        token
                      },
                      authMsg: "Your Login Link Has Been Sent To Your E-Mail",
                      authState: "successful"
                    });
                  }
                })
                .catch((err) => {
                  if(err){
                    res.status(404).json({
                      err,
                      authState: "unsuccessful",
                      errorMsg: "An Error Occured, Try Again"
                    });
                  }
                });
              });
            }
            res.status(404).json({
              errorMsg: "An Error Occured, Try Again"
            });
          })
          .catch((err) => {
            if(err){
              res.status(404).json({
                errorMsg: "An Error Occured, Try Again"
              });
            }
          });
        }
        res.status(404).json({
          errorMsg: "An Error Occured, Try Again"
        });
      })
      .catch((err) => {
        if(err){
          res.status(404).json({
            err,
            errorMsg: "An Error Occured, Try Again"
          });
        }
      });
    }

    FinancePD.findOne({
      email,
      linkId
    }).then((financeDetails) => {
      if(financeDetails){
        financeDetails.password = generatePassword.generate({
          length: 10,
          numbers: true,
          symbols: true
        });
  
        return bcrypt.hash(financeDetails.password, 10).then((hash) => {
          if(hash){
            return new Login({
              role: financeDetails.role,
              password: hash
            }).save().then((newLoginDetails) => {
              if(newLoginDetails){
                var userDetails = {
                  user: financeDetails,
                  queryId: newLoginDetails._id,
                  password: financeDetails.password
                };
                return jwt.sign({userDetails}, "secretKey", {expiresIn: "24h"}, (err, token) => {
                  if(err){
                    return res.status(404).json({
                      errorMsg: "An Error Occured, Try Again"
                    });
                  }
                  
                  var message = `Dear ${financeDetails.firstName}, you can login to GTUC COURSE-REG using this <a href=http://localhost:5000/finance/welcome/${token}>LOGIN LINK</a>. Please note that, this link is valid for only 24 hours and also becomes inactive after you logout from the application.`;
    
                  EmailAPI(Mailgun, financeDetails, message).then((sent) => {
                    if(sent){
                      return res.status(200).json({
                        user: {
                          details: userDetails.user,
                          token
                        },
                        authMsg: "Your Login Link Has Been Sent To Your E-Mail",
                        authState: "successful"
                      });
                    }
                  })
                  .catch((err) => {
                    if(err){
                      res.status(404).json({
                        err,
                        authState: "unsuccessful",
                        errorMsg: "An Error Occured, Try Again"
                      });
                    }
                  });
                });
              }
              res.status(404).json({
                errorMsg: "An Error Occured, Try Again"
              });
            })
            .catch((err) => {
              if(err){
                res.status(404).json({
                  err,
                  errorMsg: "An Error Occured, Try Again"
                });
              }
            });
          }
          res.status(404).json({
            errorMsg: "An Error Occured, Try Again"
          });
        })
        .catch((err) => {
          if(err){
            res.status(404).json({
              err,
              errorMsg: "An Error Occured, Try Again"
            });
          }
        });
      }

      AdminPD.findOne({
        email,
        linkId
      }).then((adminDetails) => {
        if(adminDetails){
          adminDetails.password = generatePassword.generate({
            length: 10,
            numbers: true,
            symbols: true
          });
    
          return bcrypt.hash(adminDetails.password, 10).then((hash) => {
            if(hash){
              return new Login({
                role: adminDetails.role,
                password: hash
              }).save().then((newLoginDetails) => {
                if(newLoginDetails){
                  var userDetails = {
                    user: adminDetails,
                    queryId: newLoginDetails._id,
                    password: adminDetails.password
                  };
                  return jwt.sign({userDetails}, "secretKey", {expiresIn: "24h"}, (err, token) => {
                    if(err){
                      return res.status(404).json({
                        errorMsg: "An Error Occured, Try Again"
                      });
                    }
                    
                    var message = `Dear ${adminDetails.firstName}, you can login to GTUC COURSE-REG using this <a href=http://localhost:5000/admin/welcome/${token}>LOGIN LINK</a>. Please note that, this link is valid for only 24 hours and also becomes inactive after you logout from the application.`;
      
                    EmailAPI(Mailgun, adminDetails, message).then((sent) => {
                      if(sent){
                        return res.status(200).json({
                          user: {
                            details: userDetails.user,
                            token
                          },
                          authMsg: "Your Login Link Has Been Sent To Your E-Mail",
                          authState: "successful"
                        });
                      }
                    })
                    .catch((err) => {
                      if(err){
                        res.status(404).json({
                          err,
                          authState: "unsuccessful",
                          errorMsg: "An Error Occured, Try Again"
                        });
                      }
                    });
                  });
                }
                res.status(404).json({
                  errorMsg: "An Error Occured, Try Again"
                });
              })
              .catch((err) => {
                if(err){
                  res.status(404).json({
                    err,
                    errorMsg: "An Error Occured, Try Again"
                  });
                }
              });
            }
            res.status(404).json({
              errorMsg: "An Error Occured, Try Again"
            });
          })
          .catch((err) => {
            if(err){
              res.status(404).json({
                err,
                errorMsg: "An Error Occured, Try Again"
              });
            }
          });
        }    
        res.status(404).json({
          authState: "unsuccessful",
          errorMsg: "Incorrect Login Credentials Provided"
        });
      })
      .catch((err) => {
        if(err){
          res.status(404).json({
            err,
            errorMsg: "An Error Occured, Try Again"
          });
        }
      });
    })
    .catch((err) => {
      if(err){
        res.status(404).json({
          err,
          errorMsg: "An Error Occured, Try Again"
        });
      }
    });
  })
  .catch((err) => {
    if(err){
      res.status(404).json({
        err,
        errorMsg: "An Error Occured, Try Again"
      });
    }
  });
});

//Login Auth For Student
router.post("/", (req, res) => {
  var studentDetails = {
    indexNumber: req.body.indexNumber,
    password: req.body.password
  };

  StudentLogin.findOne({
    indexNumber: studentDetails.indexNumber
  }).then((fetchedDetails) => {
    if(fetchedDetails){
      console.log(fetchedDetails)
      return bcrypt.compare(studentDetails.password, fetchedDetails.password).then((result) => {
        if(result){
          return StudentLogin.findByIdAndUpdate(fetchedDetails._id, {
            $set: {
              currentState: "loggedin"
            }
          }, {new: true}).then((updatedDetails) => {
            if(updatedDetails){
              return StudentPD.findOne({
                indexNumber: updatedDetails.indexNumber
              }).then((studentDetails) => {
                if(studentDetails){
                  var user = {
                    studentDetails,
                    loginId: updatedDetails._id
                  };
                  return jwt.sign({user}, "secretKey", {expiresIn: "24h"}, (err, token) => {
                    if(err){
                      return res.status(404).json({
                        err,
                        errorMsg: "An Error Occured, Try Again"
                      });
                    }
                    res.status(200).json({
                      user: {
                        details: studentDetails,
                        token
                      },
                      authState: "successful"
                    });
                  });
                }
                res.status(404).json({
                  err,
                  errorMsg: "An Error Occured, Try Again"
                });
              })
              .catch((err) => {
                if(err){
                  res.status(404).json({
                    err,
                    errorMsg: "An Error Occured, Try Again"
                  });
                }
              });
            }
            res.status(404).json({
              errorMsg: "An Error Occured, Try Again"
            });
          })
          .catch((err) => {
            if(err){
              res.status(404).json({
                err,
                errorMsg: "An Error Occured, Try Again"
              });
            }
          });
        }
        res.status(404).json({
          errorMsg: "Incorrect Login Credentials Provided",
          authState: "unsuccessful"
        });
      })
      .catch((err) => {
        if(err){
          res.status(404).json({
            err,
            errorMsg: "An Error Occured, Try Again"
          });
        }
      });
    }
    res.status(404).json({
      errorMsg: "Incorrect Login Credentials Provided",
      authState: "unsuccessful"
    });
  })
  .catch((err) => {
    if(err){
      res.status(404).json({
        err,
        errorMsg: "An Error Occured, Try Again"
      });
    }
  });
});

module.exports = router;