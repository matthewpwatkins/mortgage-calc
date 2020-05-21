var app = new Vue({
  el: "#app",
  data: {
    config: {
      loanAmount: 440000,
      extraPayments: [
        {
          year: 1,
          month: 12,
          amount: 35000,
        },
        {
          year: 2,
          month: 12,
          amount: 35000,
        },
        {
          year: 3,
          month: 12,
          amount: 35000,
        },
        {
          year: 4,
          month: 12,
          amount: 35000,
        },
      ],
      options: [
        {
          term: 360,
          rate: 3.125,
        },
        {
          term: 180,
          rate: 2.5,
        },
      ],
    },
    schedules: [],
  },
  methods: {
    calculateAll: function () {
      this.schedules = this.config.options.map(this.calculate);
    },
    calculate: function (option) {
      const schedule = {
        monthlyPayment: this.calculateMonthlyPayment(option),
        years: [],
      };

      const monthlyInterestRate = (option.rate * 0.01) / 12;

      let balance = this.config.loanAmount;
      let cumulativeInterest = 0;

      for (let i = 0; i < option.term; i++) {
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

        for (const extraPayment of this.config.extraPayments) {
          if ((extraPayment.year - 1) * 12 + extraPayment.month == i + 1) {
            payment.extraPaymentAmount = Math.min(extraPayment.amount, balance);
            balance -= payment.extraPaymentAmount;
            break;
          }
        }

        payment.cumulativeInterest = cumulativeInterest;
        payment.remainingBalance = balance;
        payment.cumulativePrincipal =
          this.config.loanAmount - payment.remainingBalance;

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

      return schedule;
    },
    calculateMonthlyPayment: function (option) {
      // From https://www.reference.com/business-finance/formula-calculating-mortgage-payment-bedbdfd5679ce280
      const L = this.config.loanAmount;
      const c = (option.rate * 0.01) / 12;
      const n = option.term;
      return (L * (c * Math.pow(1 + c, n))) / (Math.pow(1 + c, n) - 1)
    },
  },
});
