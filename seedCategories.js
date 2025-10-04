require('dotenv').config();
const { Category } = require('./models');

const categories = [
    // Income Categories
    { name: 'Salary', description: 'Monthly salary income', type: 'income' },
    { name: 'Freelance', description: 'Freelance work income', type: 'income' },
    { name: 'Investment', description: 'Investment returns and dividends', type: 'income' },
    { name: 'Business', description: 'Business income', type: 'income' },
    { name: 'Other Income', description: 'Other sources of income', type: 'income' },

    // Expense Categories
    { name: 'Food & Dining', description: 'Restaurant and grocery expenses', type: 'expense' },
    { name: 'Transportation', description: 'Gas, public transport, maintenance', type: 'expense' },
    { name: 'Housing', description: 'Rent, utilities, maintenance', type: 'expense' },
    { name: 'Entertainment', description: 'Movies, games, subscriptions', type: 'expense' },
    { name: 'Healthcare', description: 'Medical expenses and insurance', type: 'expense' },
    { name: 'Shopping', description: 'Clothing and personal items', type: 'expense' },
    { name: 'Education', description: 'Books, courses, training', type: 'expense' },
    { name: 'Bills & Utilities', description: 'Phone, internet, electricity', type: 'expense' },
    { name: 'Insurance', description: 'Life, health, car insurance', type: 'expense' },
    { name: 'Other Expenses', description: 'Miscellaneous expenses', type: 'expense' }
];

async function seedCategories() {
    try {
        console.log('Adding categories to database...');
        
        for (const category of categories) {
            await Category.create(category);
            console.log(`Added: ${category.name} (${category.type})`);
        }
        
        console.log('All categories added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding categories:', error);
        process.exit(1);
    }
}

seedCategories();