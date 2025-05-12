// DOM Elements
const elements = {
    // Navigation
    prevDayBtn: document.getElementById('prevDayBtn'),
    nextDayBtn: document.getElementById('nextDayBtn'),
    currentDateEl: document.getElementById('currentDate'),
    menuItems: document.querySelectorAll('.menu-item'),
    pages: document.querySelectorAll('.page'),
    sidebarToggle: document.querySelector('.sidebar-toggle'),
    sidebar: document.querySelector('.sidebar'),
    sidebarOverlay: document.querySelector('.sidebar-overlay'),
    
    
    // Task Input
    taskInput: document.getElementById('taskInput'),
    taskDescription: document.getElementById('taskDescription'),
    taskImage: document.getElementById('taskImage'),
    imagePreview: document.getElementById('imagePreview'),
    prioritySelect: document.getElementById('prioritySelect'),
    repeatSelect: document.getElementById('repeatSelect'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    
    // Task List
    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    totalTasksEl: document.getElementById('totalTasks'),
    completedTasksEl: document.getElementById('completedTasks'),
    pendingTasksEl: document.getElementById('pendingTasks'),
    sortSelect: document.getElementById('sortSelect'),
    
    // Modals
    editModal: document.getElementById('editModal'),
    editTaskInput: document.getElementById('editTaskInput'),
    editTaskDescription: document.getElementById('editTaskDescription'),
    editPrioritySelect: document.getElementById('editPrioritySelect'),
    editRepeatSelect: document.getElementById('editRepeatSelect'),
    editTaskImage: document.getElementById('editTaskImage'),
    editImagePreview: document.getElementById('editImagePreview'),
    removeImageBtn: document.getElementById('removeImageBtn'),
    saveEditBtn: document.getElementById('saveEditBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    closeBtn: document.querySelector('.close-btn'),
    
    // Task Detail Modal
    taskDetailModal: document.getElementById('taskDetailModal'),
    detailTaskTitle: document.getElementById('detailTaskTitle'),
    detailPriority: document.getElementById('detailPriority'),
    detailDueDate: document.getElementById('detailDueDate'),
    detailRepeat: document.getElementById('detailRepeat'),
    detailStatus: document.getElementById('detailStatus'),
    detailDescription: document.getElementById('detailDescription'),
    detailImage: document.getElementById('detailImage'),
    detailImageContainer: document.getElementById('detailImageContainer'),
    noImageMessage: document.getElementById('noImageMessage'),
    closeDetailBtn: document.getElementById('closeDetailBtn'),
    
    // Reports Page
    reportRange: document.getElementById('reportRange'),
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
    customRangeGroup: document.getElementById('customRangeGroup'),
    generateReportBtn: document.getElementById('generateReportBtn'),
    completionRateCircle: document.getElementById('completionRateCircle'),
    completionTable: document.getElementById('completionTable'),
    
    // PWA
    installBtn: document.getElementById('installBtn'),
    toast: document.getElementById('toast')
};

// App State
const state = {
    db: null,
    tasks: [],
    currentFilter: 'all',
    currentEditId: null,
    deferredPrompt: null,
    currentViewDate: new Date(),
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    currentPage: 'dashboard',
    charts: {
        priorityChart: null,
        dailyChart: null
    }
};

// Initialize the app
async function init() {
    await initDB();
    await loadTasks();
    displayCurrentDate();
    renderTasks();
    setupEventListeners();
    updateStats();
    checkEmptyState();
    
    // Set default dates for reports
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    
    elements.startDate.valueAsDate = oneWeekAgo;
    elements.endDate.valueAsDate = today;
}

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('TaskTrackerDB', 1);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('tasks')) {
                const store = db.createObjectStore('tasks', { keyPath: 'id' });
                store.createIndex('dueDate', 'dueDate', { unique: false });
                store.createIndex('completed', 'completed', { unique: false });
            }
        };
        
        request.onsuccess = (event) => {
            state.db = event.target.result;
            resolve();
        };
        
        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Load tasks from IndexedDB
function loadTasks() {
    return new Promise((resolve, reject) => {
        const transaction = state.db.transaction(['tasks'], 'readonly');
        const store = transaction.objectStore('tasks');
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            state.tasks = event.target.result || [];
            resolve();
        };
        
        request.onerror = (event) => {
            console.error('Error loading tasks:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Save task to IndexedDB
function saveTask(task) {
    return new Promise((resolve, reject) => {
        const transaction = state.db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        const request = store.put(task);
        
        request.onsuccess = () => {
            resolve();
        };
        
        request.onerror = (event) => {
            console.error('Error saving task:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Delete task from IndexedDB
function deleteTaskFromDB(id) {
    return new Promise((resolve, reject) => {
        const transaction = state.db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        const request = store.delete(id);
        
        request.onsuccess = () => {
            resolve();
        };
        
        request.onerror = (event) => {
            console.error('Error deleting task:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Display current date with navigation
function displayCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDateEl.textContent = state.currentViewDate.toLocaleDateString('en-US', options);
    
    // Disable next day button if it's today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    elements.nextDayBtn.disabled = state.currentViewDate.toDateString() === today.toDateString();
}

// Format date as YYYY-MM-DD
function formatDateYYYYMMDD(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// Format date for display (e.g., Nov 20)
function formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format date for reports (e.g., 11/20)
function formatShortDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

// Get tasks for specific date
function getTasksForDate(date) {
    const dateStr = formatDateYYYYMMDD(date);
    return state.tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
        return taskDate === dateStr;
    });
}

// Render tasks based on current filter and date
function renderTasks() {
    elements.taskList.innerHTML = '';
    
    let filteredTasks = getTasksForDate(state.currentViewDate);
    
    // Apply filters
    if (state.currentFilter === 'pending') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (state.currentFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (state.currentFilter === 'high') {
        filteredTasks = filteredTasks.filter(task => task.priority === 'high');
    }
    
    // Apply sorting
    const sortValue = elements.sortSelect.value;
    filteredTasks.sort((a, b) => {
        if (sortValue === 'priority') {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        } else if (sortValue === 'date') {
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortValue === 'name') {
            return a.text.localeCompare(b.text);
        }
        return 0;
    });
    
    if (filteredTasks.length === 0) {
        elements.emptyState.style.display = 'block';
    } else {
        elements.emptyState.style.display = 'none';
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            elements.taskList.appendChild(taskElement);
        });
    }
}

// Create task element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    const priorityClass = `priority-${task.priority}`;
    const repeatInfo = task.repeat !== 'none' ? 
        `<span class="task-repeat"><i class="fas fa-redo"></i> ${task.repeat}</span>` : '';
    
    const imageIndicator = task.imageUrl ? 
        '<i class="fas fa-image task-image-indicator"></i>' : '';
    
    taskElement.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-content">
            <span class="task-text">
                <span class="task-priority ${priorityClass}"></span>
                ${task.text}
                ${imageIndicator}
            </span>
            <div class="task-meta">
                ${repeatInfo}
            </div>
        </div>
        <div class="task-actions">
            <button class="edit-btn"><i class="fas fa-edit"></i></button>
            <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
        </div>
    `;
    
    taskElement.dataset.id = task.id;
    
    // Add event listeners
    const checkbox = taskElement.querySelector('.task-checkbox');
    const editBtn = taskElement.querySelector('.edit-btn');
    const deleteBtn = taskElement.querySelector('.delete-btn');
    const taskText = taskElement.querySelector('.task-text');
    
    checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
    editBtn.addEventListener('click', () => openEditModal(task.id));
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    taskText.addEventListener('click', () => showTaskDetails(task.id));
    
    return taskElement;
}

// Show task details in modal
function showTaskDetails(id) {
    const task = state.tasks.find(task => task.id === id);
    if (!task) return;
    
    elements.detailTaskTitle.textContent = task.text;
    elements.detailPriority.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    elements.detailPriority.className = `meta-value priority-${task.priority}`;
    elements.detailDueDate.textContent = formatDisplayDate(task.dueDate);
    elements.detailRepeat.textContent = task.repeat !== 'none' ? 
        task.repeat.charAt(0).toUpperCase() + task.repeat.slice(1) : 'None';
    elements.detailStatus.textContent = task.completed ? 'Completed' : 'Pending';
    elements.detailStatus.className = `meta-value ${task.completed ? 'completed' : 'pending'}`;
    elements.detailDescription.textContent = task.description || 'No description provided';
    
    if (task.imageUrl) {
        elements.detailImage.src = task.imageUrl;
        elements.detailImage.style.display = 'block';
        elements.noImageMessage.style.display = 'none';
    } else {
        elements.detailImage.style.display = 'none';
        elements.noImageMessage.style.display = 'block';
    }
    
    elements.taskDetailModal.style.display = 'flex';
}

// Add new task
async function addTask() {
    const text = elements.taskInput.value.trim();
    const description = elements.taskDescription.value.trim();
    const priority = elements.prioritySelect.value;
    const repeat = elements.repeatSelect.value;
    const imageFile = elements.taskImage.files[0];
    
    if (text === '') {
        showToast('Task cannot be empty!', 'error');
        return;
    }
    
    let imageUrl = null;
    if (imageFile) {
        imageUrl = await readFileAsDataURL(imageFile);
    }
    
    const newTask = {
        id: Date.now().toString(),
        text,
        description,
        priority,
        dueDate: formatDateYYYYMMDD(state.currentViewDate),
        repeat,
        completed: false,
        createdAt: new Date().toISOString(),
        originalDueDate: formatDateYYYYMMDD(state.currentViewDate),
        imageUrl
    };
    
    await saveTask(newTask);
    state.tasks.unshift(newTask);
    renderTasks();
    updateStats();
    checkEmptyState();
    
    // Reset inputs
    elements.taskInput.value = '';
    elements.taskDescription.value = '';
    elements.taskImage.value = '';
    elements.imagePreview.style.display = 'none';
    elements.imagePreview.innerHTML = '';
    elements.taskInput.focus();
    elements.prioritySelect.value = 'medium';
    elements.repeatSelect.value = 'none';
    
    showToast('Task added successfully!', 'success');
}

// Read file as Data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Toggle task completion with repetition logic
async function toggleTaskComplete(id) {
    const taskIndex = state.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return;

    const task = state.tasks[taskIndex];
    const today = new Date(state.currentViewDate);
    today.setHours(0, 0, 0, 0);
    
    const taskDueDate = new Date(task.dueDate);
    taskDueDate.setHours(0, 0, 0, 0);
    
    // Only allow completion on the due date
    if (today.getTime() !== taskDueDate.getTime()) {
        showToast(`This task can only be completed on ${formatDisplayDate(task.dueDate)}`, 'error');
        return;
    }

    task.completed = !task.completed;
    
    if (task.completed && task.repeat !== 'none') {
        scheduleNextTask(task);
    }
    
    await saveTask(task);
    renderTasks();
    updateStats();
    
    const message = task.completed ? 'Task completed!' : 'Task marked as pending';
    showToast(message, 'success');
}

// Schedule next task based on repeat pattern
async function scheduleNextTask(task) {
    const nextDate = new Date(task.dueDate);
    
    switch(task.repeat) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            // Handle months with different number of days
            const originalDate = new Date(task.originalDueDate).getDate();
            const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
            nextDate.setDate(Math.min(originalDate, daysInMonth));
            break;
    }
    
    const newTask = {
        ...task,
        id: Date.now().toString(),
        dueDate: formatDateYYYYMMDD(nextDate),
        completed: false
    };
    
    await saveTask(newTask);
    state.tasks.unshift(newTask);
    
    showToast(`Next occurrence scheduled for ${formatDisplayDate(nextDate)}`, 'info');
}

// Navigate to previous day
function goToPreviousDay() {
    const newDate = new Date(state.currentViewDate);
    newDate.setDate(newDate.getDate() - 1);
    state.currentViewDate = newDate;
    displayCurrentDate();
    renderTasks();
}

// Navigate to next day
function goToNextDay() {
    const newDate = new Date(state.currentViewDate);
    newDate.setDate(newDate.getDate() + 1);
    state.currentViewDate = newDate;
    displayCurrentDate();
    renderTasks();
}

// Delete task
async function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        await deleteTaskFromDB(id);
        state.tasks = state.tasks.filter(task => task.id !== id);
        renderTasks();
        updateStats();
        checkEmptyState();
        showToast('Task deleted successfully!', 'success');
    }
}

// Open edit modal
function openEditModal(id) {
    const task = state.tasks.find(task => task.id === id);
    if (task) {
        state.currentEditId = id;
        elements.editTaskInput.value = task.text;
        elements.editTaskDescription.value = task.description || '';
        elements.editPrioritySelect.value = task.priority;
        elements.editRepeatSelect.value = task.repeat;
        
        // Handle image preview
        elements.editImagePreview.innerHTML = '';
        if (task.imageUrl) {
            const img = document.createElement('img');
            img.src = task.imageUrl;
            elements.editImagePreview.appendChild(img);
            elements.editImagePreview.style.display = 'block';
        } else {
            elements.editImagePreview.style.display = 'none';
        }
        
        elements.editModal.style.display = 'flex';
    }
}

// Save edited task
async function saveEditedTask() {
    const text = elements.editTaskInput.value.trim();
    const description = elements.editTaskDescription.value.trim();
    const priority = elements.editPrioritySelect.value;
    const repeat = elements.editRepeatSelect.value;
    const imageFile = elements.editTaskImage.files[0];
    
    if (text === '') {
        showToast('Task cannot be empty!', 'error');
        return;
    }
    
    const taskIndex = state.tasks.findIndex(task => task.id === state.currentEditId);
    if (taskIndex !== -1) {
        const task = state.tasks[taskIndex];
        
        // Update task properties
        task.text = text;
        task.description = description;
        task.priority = priority;
        task.repeat = repeat;
        
        // Handle image update
        if (imageFile) {
            task.imageUrl = await readFileAsDataURL(imageFile);
        } else if (elements.editImagePreview.style.display === 'none' && task.imageUrl) {
            // Image was removed
            task.imageUrl = null;
        }
        
        await saveTask(task);
        renderTasks();
        closeEditModal();
        showToast('Task updated successfully!', 'success');
    }
}

// Close edit modal
function closeEditModal() {
    elements.editModal.style.display = 'none';
    elements.editTaskInput.value = '';
    elements.editTaskDescription.value = '';
    elements.editTaskImage.value = '';
    elements.editImagePreview.innerHTML = '';
    elements.editImagePreview.style.display = 'none';
    state.currentEditId = null;
}

// Close task detail modal
function closeTaskDetailModal() {
    elements.taskDetailModal.style.display = 'none';
}

// Update statistics
function updateStats() {
    const tasksForDate = getTasksForDate(state.currentViewDate);
    elements.totalTasksEl.textContent = tasksForDate.length;
    const completedCount = tasksForDate.filter(task => task.completed).length;
    elements.completedTasksEl.textContent = completedCount;
    elements.pendingTasksEl.textContent = tasksForDate.length - completedCount;
}

// Check if task list is empty
function checkEmptyState() {
    const tasksForDate = getTasksForDate(state.currentViewDate);
    if (tasksForDate.length === 0) {
        elements.emptyState.style.display = 'block';
    } else {
        elements.emptyState.style.display = 'none';
    }
}

// Show toast notification
function showToast(message, type) {
    elements.toast.textContent = message;
    elements.toast.className = 'toast show';
    
    if (type === 'error') {
        elements.toast.style.backgroundColor = 'var(--danger-color)';
    } else if (type === 'success') {
        elements.toast.style.backgroundColor = 'var(--success-color)';
    } else if (type === 'info') {
        elements.toast.style.backgroundColor = 'var(--accent-color)';
    } else {
        elements.toast.style.backgroundColor = 'var(--primary-color)';
    }
    
    setTimeout(() => {
        elements.toast.className = 'toast';
    }, 3000);
}

// Generate reports
async function generateReport() {
    let startDate, endDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (elements.reportRange.value) {
        case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            endDate = new Date(today);
            break;
        case 'month':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 30);
            endDate = new Date(today);
            break;
        case 'quarter':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 90);
            endDate = new Date(today);
            break;
        case 'year':
            startDate = new Date(today);
            startDate.setFullYear(today.getFullYear() - 1);
            endDate = new Date(today);
            break;
        case 'custom':
            startDate = new Date(elements.startDate.value);
            endDate = new Date(elements.endDate.value);
            break;
    }
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Get tasks in date range
    const tasksInRange = state.tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= startDate && taskDate <= endDate;
    });
    
    // Calculate completion rate
    const totalTasks = tasksInRange.length;
    const completedTasks = tasksInRange.filter(task => task.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Update completion circle
    const circleProgress = elements.completionRateCircle.querySelector('.circle-progress');
    const circleText = elements.completionRateCircle.querySelector('.circle-text');
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (completionRate / 100) * circumference;
    
    circleProgress.style.strokeDasharray = circumference;
    circleProgress.style.strokeDashoffset = offset;
    circleText.textContent = `${completionRate}%`;
    
    // Generate priority distribution chart
    generatePriorityChart(tasksInRange);
    
    // Generate daily completion chart
    generateDailyChart(tasksInRange, startDate, endDate);
    
    // Generate completion table
    generateCompletionTable(tasksInRange, startDate, endDate);
}

// Generate priority distribution chart
function generatePriorityChart(tasks) {
    const priorityCounts = {
        high: 0,
        medium: 0,
        low: 0
    };
    
    tasks.forEach(task => {
        priorityCounts[task.priority]++;
    });
    
    const ctx = document.getElementById('priorityChart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (state.charts.priorityChart) {
        state.charts.priorityChart.destroy();
    }
    
    state.charts.priorityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['High Priority', 'Medium Priority', 'Low Priority'],
            datasets: [{
                data: [priorityCounts.high, priorityCounts.medium, priorityCounts.low],
                backgroundColor: [
                    'var(--high-priority)',
                    'var(--medium-priority)',
                    'var(--low-priority)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Generate daily completion chart
function generateDailyChart(tasks, startDate, endDate) {
    // Group tasks by date
    const dateMap = {};
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dateStr = formatDateYYYYMMDD(currentDate);
        dateMap[dateStr] = {
            date: new Date(currentDate),
            total: 0,
            completed: 0
        };
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    tasks.forEach(task => {
        const dateStr = task.dueDate;
        if (dateMap[dateStr]) {
            dateMap[dateStr].total++;
            if (task.completed) {
                dateMap[dateStr].completed++;
            }
        }
    });
    
    // Prepare data for chart
    const dates = [];
    const completedData = [];
    const totalData = [];
    
    Object.keys(dateMap).sort().forEach(dateStr => {
        const dayData = dateMap[dateStr];
        dates.push(formatShortDate(dayData.date));
        completedData.push(dayData.completed);
        totalData.push(dayData.total);
    });
    
    const ctx = document.getElementById('dailyChart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (state.charts.dailyChart) {
        state.charts.dailyChart.destroy();
    }
    
    state.charts.dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Completed',
                    data: completedData,
                    backgroundColor: 'var(--success-color)',
                    borderColor: 'var(--success-color)',
                    borderWidth: 1
                },
                {
                    label: 'Total',
                    data: totalData,
                    backgroundColor: 'var(--primary-color)',
                    borderColor: 'var(--primary-color)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Generate completion table
function generateCompletionTable(tasks, startDate, endDate) {
    // Group tasks by date
    const dateMap = {};
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dateStr = formatDateYYYYMMDD(currentDate);
        dateMap[dateStr] = {
            date: new Date(currentDate),
            total: 0,
            completed: 0
        };
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    tasks.forEach(task => {
        const dateStr = task.dueDate;
        if (dateMap[dateStr]) {
            dateMap[dateStr].total++;
            if (task.completed) {
                dateMap[dateStr].completed++;
            }
        }
    });
    
    // Sort dates and generate table rows
    const tableBody = elements.completionTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    Object.keys(dateMap)
        .sort()
        .forEach(dateStr => {
            const dayData = dateMap[dateStr];
            const completionRate = dayData.total > 0 ? 
                Math.round((dayData.completed / dayData.total) * 100) : 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dayData.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                <td>${dayData.total}</td>
                <td>${dayData.completed}</td>
                <td>
                    <div class="completion-bar-container">
                        <div class="completion-bar" style="width: ${completionRate}%"></div>
                        <span>${completionRate}%</span>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
}

// Switch between pages
function switchPage(pageId) {
    // Update active menu item
    elements.menuItems.forEach(item => {
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Show the selected page
    elements.pages.forEach(page => {
        if (page.id === `${pageId}-page`) {
            page.style.display = 'flex';
            state.currentPage = pageId;
            
            // If switching to reports page, generate initial report
            if (pageId === 'reports') {
                generateReport();
            }
        } else {
            page.style.display = 'none';
        }
    });
}

// Set up event listeners
function setupEventListeners() {
    // Date navigation
    elements.prevDayBtn.addEventListener('click', goToPreviousDay);
    elements.nextDayBtn.addEventListener('click', goToNextDay);

 document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) { // Only for mobile
                toggleSidebar(); // Close the sidebar
            }
        });
    });


    
// Sidebar toggle
    elements.sidebarToggle.addEventListener('click', toggleSidebar);
    elements.sidebarOverlay.addEventListener('click', toggleSidebar);



    // Add task
    elements.addTaskBtn.addEventListener('click', addTask);
    elements.taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });



// Add this new function
function toggleSidebar() {
    elements.sidebar.classList.toggle('active');
    elements.sidebarOverlay.classList.toggle('active');
    
    // Prevent scrolling when sidebar is open
    document.body.classList.toggle('sidebar-open', elements.sidebar.classList.contains('active'));
}


    
    
    // Image preview for new task
    elements.taskImage.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                elements.imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                elements.imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // Image preview for edit task
    elements.editTaskImage.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                elements.editImagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                elements.editImagePreview.style.display = 'block';
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // Remove image button
    elements.removeImageBtn.addEventListener('click', function() {
        elements.editImagePreview.innerHTML = '';
        elements.editImagePreview.style.display = 'none';
    });
    
    // Filter tasks
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    // Sort tasks
    elements.sortSelect.addEventListener('change', renderTasks);
    
    // Edit modal
    elements.saveEditBtn.addEventListener('click', saveEditedTask);
    elements.cancelEditBtn.addEventListener('click', closeEditModal);
    elements.closeBtn.addEventListener('click', closeEditModal);
    window.addEventListener('click', (e) => {
        if (e.target === elements.editModal) closeEditModal();
        if (e.target === elements.taskDetailModal) closeTaskDetailModal();
    });
    
    // Task detail modal
    elements.closeDetailBtn.addEventListener('click', closeTaskDetailModal);
    
    // Navigation menu
    elements.menuItems.forEach(item => {
        item.addEventListener('click', () => switchPage(item.dataset.page));
    });
    
    // Reports page
    elements.reportRange.addEventListener('change', function() {
        elements.customRangeGroup.style.display = this.value === 'custom' ? 'flex' : 'none';
    });
    
    elements.generateReportBtn.addEventListener('click', generateReport);
    
    // PWA installation
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        state.deferredPrompt = e;
        elements.installBtn.style.display = 'block';
        
        e.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted install prompt');
            } else {
                console.log('User dismissed install prompt');
            }
            state.deferredPrompt = null;
            elements.installBtn.style.display = 'none';
        });
    });
    
    elements.installBtn.addEventListener('click', async () => {
        if (!state.deferredPrompt) {
            showToast('Installation will be available after more interaction', 'info');
            return;
        }
        
        state.deferredPrompt.prompt();
        const { outcome } = await state.deferredPrompt.userChoice;
        
        console.log(`User response: ${outcome}`);
        state.deferredPrompt = null;
        elements.installBtn.style.display = 'none';
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        elements.installBtn.style.display = 'none';
        state.deferredPrompt = null;
    });
}

// Initialize the app
init();
