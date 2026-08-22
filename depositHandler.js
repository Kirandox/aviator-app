const fs = require('fs');
const path = require('path');

function handleAcceptDeposit(req, res, dbPath = './database.json') {
  const depositId = req.params.id;

  try {
    const rawData = fs.readFileSync(path.resolve(dbPath));
    const db = JSON.parse(rawData);

    const deposit = db.deposits.find(d => d.id == depositId && d.status === 'pending');
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found or already processed.' });
    }

    deposit.status = 'approved';

    const user = db.users.find(u => u.id == deposit.userId);
    if (user) {
      user.balance += parseFloat(deposit.amount);
    }

    fs.writeFileSync(path.resolve(dbPath), JSON.stringify(db, null, 2));
    return res.json({ success: true, message: 'Deposit accepted and balance updated automatically.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function handleRejectDeposit(req, res, dbPath = './database.json') {
  const depositId = req.params.id;
  try {
    const rawData = fs.readFileSync(path.resolve(dbPath));
    const db = JSON.parse(rawData);

    const deposit = db.deposits.find(d => d.id == depositId && d.status === 'pending');
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found.' });
    }

    deposit.status = 'rejected';
    fs.writeFileSync(path.resolve(dbPath), JSON.stringify(db, null, 2));

    return res.json({ success: true, message: 'Deposit rejected.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  handleAcceptDeposit,
  handleRejectDeposit
};

