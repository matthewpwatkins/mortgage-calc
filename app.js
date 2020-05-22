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
      const schedule = {
        monthlyPayment: this.calculateMonthlyPayment(config),
        years: [],
      };

      const monthlyInterestRate = (config.rate * 0.01) / 12;

      let balance = config.loanAmount;
      let cumulativeInterest = 0;

      for (let i = 0; i < config.term; i++) {
        if (i % 12 == 0) {
          schedule.years.push({
            payments: [],
          });
        }
        const year = schedule.years[schedule.years.length - 1];
        const payment = {
          extraPaymentAmount: 0,
          interest: monthlyInterestRate * balance,
        };
        cumulativeInterest += payment.interest;

        payment.principal = Math.min(
          balance,
          schedule.monthlyPayment - payment.interest
        );
        balance -= payment.principal;

        for (const extraPayment of config.extraPayments) {
          if ((extraPayment.year - 1) * 12 + extraPayment.month == i + 1) {
            payment.extraPaymentAmount = Math.min(extraPayment.amount, balance);
            balance -= payment.extraPaymentAmount;
            break;
          }
        }

        payment.cumulativeInterest = cumulativeInterest;
        payment.remainingBalance = balance;
        payment.cumulativePrincipal =
          config.loanAmount - payment.remainingBalance;

        year.payments.push(payment);

        if (balance == 0) {
          // Paid off early!
          break;
        }
      }

      // Take care of any remaining cents
      const lastYear = schedule.years[schedule.years.length - 1];
      const lastPayment = lastYear.payments[lastYear.payments.length - 1];

      if (lastPayment.remainingBalance > 0) {
        lastPayment.principal += lastPayment.remainingBalance;
        lastPayment.remainingBalance = 0;
      }

      schedule.lastPaymentYear = schedule.years.length;
      schedule.lastPaymentMonth = lastYear.payments.length;
      schedule.lastPayment = lastPayment;

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
