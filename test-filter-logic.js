// Test the workflow filter logic
const tasks = [
    { id: 1, title: "Due Diligence: AWS" },
    { id: 2, title: "Due Diligence: tesla" },
    { id: 5, title: "Due Diligence: KPMG" },
    { id: 6, title: "Due Diligence: NBK (national bank of kuwait)" },
    { id: 7, title: "Due Diligence: NBK (national bank of kuwait)" },
    { id: 4, title: "njdsbf" }
];

console.log('🧪 TESTING WORKFLOW FILTER LOGIC');
console.log('=================================\n');

console.log('📋 All tasks:');
tasks.forEach(task => {
    console.log(`   - ID: ${task.id}, Title: "${task.title}"`);
});

console.log('\n🎯 Filter: title.toLowerCase().startsWith("due diligence:")');
const filteredTasks = tasks.filter(task => 
    task.title && task.title.toLowerCase().startsWith('due diligence:')
);

console.log(`\n✅ Filtered tasks (${filteredTasks.length} found):`);
filteredTasks.forEach(task => {
    console.log(`   - ID: ${task.id}, Title: "${task.title}"`);
});

if (filteredTasks.length > 0) {
    console.log('\n🚀 FILTER LOGIC IS WORKING!');
    console.log('📝 The workflow should process these tasks automatically.');
} else {
    console.log('\n❌ FILTER LOGIC FAILED!');
    console.log('🔧 Check the filter condition in the workflow.');
}
