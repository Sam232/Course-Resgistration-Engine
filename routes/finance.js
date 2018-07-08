const router = require("express").Router();
const {ObjectID} = require("mongodb");

const FinancePD = require("../models/FinancePD");
const Payment = require("../models/Payment");

const {verifyToken} = require("../config/verifyToken");

//Add Payment
router.post("/add/payment/:financeId", verifyToken, (req, res) => {
  var paymentDetails = {
    financeId: req.params.financeId,
    indexNumber: req.body.indexNumber,
    level: req.body.level,
    semester: req.body.semester,
    paid: req.body.paid
  };

  if(!ObjectID.isValid(paymentDetails.financeId)){
    return res.status(404).json({
      errorMsg: "Invalid Financial ID Provided"
    });
  }

  FinancePD.findById(paymentDetails.financeId).then((financeDetails) => {
    if(financeDetails){
      return Payment.findOne({
        indexNumber: paymentDetails.indexNumber,
        level: paymentDetails.level,
        semester: paymentDetails.semester
      }).then((existingPayment) => {
        if(existingPayment){
          return res.status(404).json({
            errorMsg: "Payment Has Been Already Made"
          });
        }
        new Payment(paymentDetails).save().then((newPayment) => {
          if(newPayment){
            return res.status(200).json({
              newPayment,
              addState: "successful"
            });
          }
          res.status(200).json({
            errorMsg: "Unable To Add New Payment",
            addState: "unsuccessful"
          });          
        })
        .catch((err) => {
          if(err){
            res.status(404).json({
              err,
              errorMsg: "Unable To Add New Payment, Try Again"
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
    }
    res.status(404).json({
      errorMsg: "No Financial Accountant\'s ID Matches The Provided ID"
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

//View Payment
router.get("/view/payments/:financeId", verifyToken, (req, res) => {
  var financeId = req.params.financeId;

  if(!ObjectID.isValid(financeId)){
    return res.status(404).json({
      errorMsg: "Invalid Finance ID Provided"
    });
  }

  FinancePD.findById(financeId).then((financeDetails) => {
    if(financeDetails){
      return Payment.find({}).then((payments) => {
        if(payments){
          return res.status(200).json({
            payments,
            queryState: "successful"
          });
        }
        res.status(404).json({
          errorMsg: "Unable To Fetch Payments, Try Again",
          queryState: "successful"
        });
      })
      .catch((err) => {
        if(err){
          res.status(404).json({
            err,
            errorMsg: "Unable To Fetch Payments, Try Again"
          });
        }
      })
    }
    res.status(404).json({
      errorMsg: "No Financial Accountant\'s ID Matches The Provided ID"
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

//Update Payment
router.put("/update/payment/:paymentId", verifyToken, (req, res) => {
  var paymentDetails = {
    paymentId: req.params.paymentId,
    indexNumber: req.body.indexNumber,
    level: req.body.level,
    semester: req.body.semester,
    paid: req.body.paid
  };

  if(!ObjectID.isValid(paymentDetails.paymentId)){
    return res.status(404).json({
      errorMsg: "Invalid Payment ID Provided"
    });
  }

  Payment.findById(paymentDetails.paymentId).then((fetchedPayment) => {
    if(fetchedPayment){
      return Payment.find({
        _id: {$ne: paymentDetails.paymentId}
      }).then((allPayment) => {
        if(allPayment.length > 0){
          var existingPayment = allPayment.filter(payment => payment.indexNumber == paymentDetails.indexNumber && payment.level == paymentDetails.level && payment.semester == paymentDetails.semester);

          if(existingPayment.length > 0){
            return res.status(404).json({
              errorMsg: "Payment Details Already Exist"
            });
          }
          else{
            return Payment.findByIdAndUpdate(paymentDetails.paymentId, {
              $set: {
                indexNumber: paymentDetails.indexNumber,
                level: paymentDetails.level,
                semester: paymentDetails.semester
              }
            }, {new: true}).then((updatedPayment) => {
              if(updatedPayment){
                return res.status(200).json({
                  updatedPayment,
                  updateState: "successful"
                });
              }
              res.status(404).json({
                updateState: "unsuccessful"
              });
            })
            .catch((err) => {
              if(err){
                res.status(404).json({
                  err,
                  errorMsg: "Unable To Update Payment Details"
                });
              }
            });
          }
        }

        Payment.findByIdAndUpdate(paymentDetails.paymentId, {
          $set: {
            indexNumber: paymentDetails.indexNumber,
            level: paymentDetails.level,
            semester: paymentDetails.semester
          }
        }, {new: true}).then((updatedPayment) => {
          if(updatedPayment){
            return res.status(200).json({
              updatedPayment,
              updateState: "successful"
            });
          }
          res.status(404).json({
            updateState: "unsuccessful"
          });
        })
        .catch((err) => {
          if(err){
            res.status(404).json({
              err,
              errorMsg: "Unable To Update Payment Details"
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
      })
    }
    res.status(404).json({
      errorMsg: "No Payment\'s ID Matches The Provided ID"
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