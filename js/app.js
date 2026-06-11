document.addEventListener("DOMContentLoaded", () => {
    // 1. Mostrar fecha en tiempo real y verificar Alerta de Tarjeta
    const updateDateAndAlerts = () => {
        const dateElement = document.getElementById('current-date');
        const alertElement = document.getElementById('credit-alert');
        
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('es-ES', options).toUpperCase();

        const currentDay = now.getDate();
        // Si estamos entre el día 13 y el 23, mostrar alerta de pago
        if (currentDay >= 13 && currentDay <= 23) {
            alertElement.classList.remove('hidden');
        } else {
            alertElement.classList.add('hidden');
        }
    };

    updateDateAndAlerts();

    // 2. Base de datos local (localStorage)
    let transactions = JSON.parse(localStorage.getItem('finanzas_data')) || [];

    // 3. Variables del DOM
    const form = document.getElementById('transaction-form');
    const tableBody = document.getElementById('history-body');
    const totalBalanceEl = document.getElementById('total-balance');
    const cashBalanceEl = document.getElementById('cash-balance');
    const debitBalanceEl = document.getElementById('debit-balance');
    const creditBalanceEl = document.getElementById('credit-balance');
    const debtBalanceEl = document.getElementById('debt-balance');

    // 4. Actualizar la interfaz y cálculos
    const updateUI = () => {
        let cash = 0;
        let debit = 0;
        let creditDebt = 0;
        let otherDebts = 0;

        tableBody.innerHTML = ""; // Limpiar tabla

        // Recorrer transacciones y calcular
        transactions.forEach(t => {
            // Llenar tabla
            const tr = document.createElement('tr');
            const colorClass = t.type === 'ingreso' ? 'text-green' : 'text-red';
            const sign = t.type === 'ingreso' ? '+' : '-';
            
            tr.innerHTML = `
                <td>${t.date}</td>
                <td>${t.desc}</td>
                <td>${t.account.toUpperCase()}</td>
                <td class="${colorClass}">${sign}$${t.amount.toFixed(2)}</td>
            `;
            tableBody.prepend(tr); // Agregar al inicio (más recientes arriba)

            // Calcular saldos
            const amt = parseFloat(t.amount);
            if (t.type === 'ingreso') {
                if (t.account === 'efectivo') cash += amt;
                if (t.account === 'debito') debit += amt;
                // Si tienes ingresos a tarjeta de crédito, cuenta como pago (reduce deuda)
                if (t.account === 'credito') creditDebt -= amt; 
            } else if (t.type === 'gasto') {
                if (t.account === 'efectivo') cash -= amt;
                if (t.account === 'debito') debit -= amt;
                if (t.account === 'credito') creditDebt += amt;
            } else if (t.type === 'deuda') {
                otherDebts += amt;
            }
        });

        // Asegurar que la deuda de crédito no sea negativa (si pagaste de más)
        if (creditDebt < 0) creditDebt = 0;

        // Calcular Total (Dinero real - Deudas)
        const total = (cash + debit) - (creditDebt + otherDebts);

        // Imprimir en pantalla
        cashBalanceEl.textContent = `$${cash.toFixed(2)}`;
        debitBalanceEl.textContent = `$${debit.toFixed(2)}`;
        creditBalanceEl.textContent = `$${creditDebt.toFixed(2)}`;
        debtBalanceEl.textContent = `$${otherDebts.toFixed(2)}`;
        
        totalBalanceEl.textContent = `$${total.toFixed(2)}`;

        // Lógica de colores (Verde si es positivo o 0, Rojo si es negativo)
        if (total >= 0) {
            totalBalanceEl.style.color = "var(--neon-green)";
            totalBalanceEl.style.textShadow = "0 0 15px rgba(0, 255, 102, 0.4)";
        } else {
            totalBalanceEl.style.color = "var(--neon-red)";
            totalBalanceEl.style.textShadow = "0 0 15px rgba(255, 51, 102, 0.4)";
        }
    };

    // 5. Manejar el formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const type = document.getElementById('trans-type').value;
        const account = document.getElementById('trans-account').value;
        const amount = document.getElementById('trans-amount').value;
        const desc = document.getElementById('trans-desc').value;

        const newTransaction = {
            id: Date.now(),
            date: new Date().toLocaleDateString('es-ES'),
            type: type,
            account: account,
            amount: parseFloat(amount),
            desc: desc
        };

        transactions.push(newTransaction);
        
        // Guardar en LocalStorage
        localStorage.setItem('finanzas_data', JSON.stringify(transactions));

        // Limpiar formulario y actualizar vista
        form.reset();
        updateUI();
    });

    // Inicializar la vista al cargar
    updateUI();
});