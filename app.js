var app = new Vue({
  el: "#app",
  data: {
    configs: [
      {
        term: 360,
        rate: 3.125,
        loanAmount: 440000,
        extraPayments: [],
      },
    ],
    schedules: [],
  },
  methods: {
    addConfig: function () {
      this.configs.push({
        term: 360,
        extraPayments: [],
      });
    },
    addExtraPayment: function (configIndex) {
      this.configs[configIndex].extraPayments.push({});
    },
    calculateAll: function () {
      this.schedules = this.configs.map(this.calculate);
    },
    calculate: function (config) {
      let balance = config.loanAmount;
      const monthlyInterestRate = (config.rate * 0.01) / 12;
      const schedule = {
        monthlyPayment: this.calculateMonthlyPayment(config),
        years: [],
        summary: {
          interest: 0,
          principal: 0
        }
      };

      for (let i = 0; i < config.term; i++) {
        if (i % 12 == 0) {
          // It's a new year!
          schedule.years.push({
            payments: [],
            summary: {
              interest: 0,
              principal: 0
            }
          });
        }

        // Build the normal payment
        const year = schedule.years[schedule.years.length - 1];
        const payment = { interest: monthlyInterestRate * balance };
        payment.principal = Math.min(balance, schedule.monthlyPayment - payment.interest);
        balance -= payment.principal;

        // Apply extra payment if necessary
        for (const extraPayment of config.extraPayments) {
          if ((extraPayment.year - 1) * 12 + extraPayment.month == i + 1) {
            const amountToAdd = Math.min(extraPayment.amount, balance);
            payment.principal += amountToAdd;
            balance -= amountToAdd;
          }
        }

        // Update the total and yearly summaries
        schedule.summary.interest += payment.interest;
        year.summary.interest += payment.interest;
        schedule.summary.principal += payment.principal;
        year.summary.principal += payment.principal;

        // Apply cumulative snapshot
        payment.snapshot = {
          cumulativeInterest: schedule.summary.interest,
          cumulativePrincipal: schedule.summary.principal,
          remainingBalance: balance
        };

        year.payments.push(payment);

        if (balance == 0) {
          // Paid off early!
          break;
        }
      }

      // Take care of any remaining cents
      const lastYear = schedule.years[schedule.years.length - 1];
      const lastPayment = lastYear.payments[lastYear.payments.length - 1];

      // Set "last" pointers
      if (lastPayment.remainingBalance > 0) {
        lastPayment.principal += lastPayment.remainingBalance;
        lastPayment.remainingBalance = 0;
      }

      schedule.lastPaymentYear = schedule.years.length;
      schedule.lastPaymentMonth = lastYear.payments.length;
      schedule.lastPayment = lastPayment;

      for (const year of schedule.years) {
        year.lastPayment = year.payments[year.payments.length - 1];
        year.summary.remainingBalance = year.lastPayment.remainingBalance;
      }

      return schedule;
    },
    calculateMonthlyPayment: function (config) {
      // From https://www.reference.com/business-finance/formula-calculating-mortgage-payment-bedbdfd5679ce280
      const L = config.loanAmount;
      const c = (config.rate * 0.01) / 12;
      const n = config.term;
      return (L * (c * Math.pow(1 + c, n))) / (Math.pow(1 + c, n) - 1);
    },
  },
});
