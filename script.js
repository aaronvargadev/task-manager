import { getTasks, addTask, updateTask, deleteTask } from './idb.js';

document.addEventListener('DOMContentLoaded', async () => {
    const taskListOutput = document.getElementById('task-list');
    const newTaskInput = document.getElementById('new-task-title');
    const addButton = document.getElementById('add-button');
    let tasks = [];

    // --- Render Function ---
    const renderTasks = () => {
        taskListOutput.innerHTML = '';
        if (tasks.length === 0) {
            taskListOutput.innerHTML = '<p>No tasks yet. Add one!</p>';
            return;
        }
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${task.status === 'complete' ? 'done' : ''}`;
            taskItem.dataset.id = task.id;
            taskItem.draggable = true;

            taskItem.innerHTML = `
                <h4 class="task-title">${task.title}</h4>
                <div class="task-item-nav">
                    <button class="edit-button">Edit</button>
                    <button class="done-button">${task.status === 'complete' ? 'Undo' : 'Done'}</button>
                    <button class="delete-button">Delete</button>
                </div>
            `;
            taskListOutput.appendChild(taskItem);
        });
    };

    // --- Initial Load ---
    const loadTasks = async () => {
        try {
            const dbTasks = await getTasks();
            if (dbTasks.length > 0) {
                tasks = dbTasks;
            } else {
                // If DB is empty, fetch from JSON and populate DB
                const response = await fetch('data.json');
                const data = await response.json();
                tasks = data.tasks || [];
                // Use Promise.all to wait for all addTask operations
                await Promise.all(tasks.map(task => addTask(task)));
            }
            renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            taskListOutput.innerHTML = '<p>Error loading data.</p>';
        }
    };

    // --- Event Listeners ---

    // Add a new task
    addButton.addEventListener('click', async () => {
        const title = newTaskInput.value.trim();
        if (title) {
            const newTask = { id: Date.now(), title, status: 'incomplete' };
            await addTask(newTask);
            tasks.push(newTask);
            newTaskInput.value = '';
            newTaskInput.classList.remove('error'); // Remove error class on successful add
            renderTasks();
        } else {
            // Show error validation
            newTaskInput.classList.add('error');
            newTaskInput.placeholder = 'Task title cannot be empty!';
        }
    });

    // Clear error validation when user focuses on the input
    newTaskInput.addEventListener('focus', () => {
        if (newTaskInput.classList.contains('error')) {
            newTaskInput.classList.remove('error');
            newTaskInput.placeholder = 'New Task Title'; // Reset placeholder
        }
    });

    // Handle clicks on task buttons (Edit, Done, Delete)
    taskListOutput.addEventListener('click', async (e) => {
        const target = e.target;
        const taskItem = target.closest('.task-item');
        if (!taskItem) return;

        const id = parseInt(taskItem.dataset.id, 10);
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Delete Task
        if (target.classList.contains('delete-button')) {
            await deleteTask(id);
            tasks = tasks.filter(t => t.id !== id);
            renderTasks();
        }

        // Mark Task as Done/Undo
        if (target.classList.contains('done-button')) {
            task.status = task.status === 'complete' ? 'incomplete' : 'complete';
            await updateTask(task);

            renderTasks();
        }

        // Edit Task
        if (target.classList.contains('edit-button')) {
            const titleElement = taskItem.querySelector('.task-title');
            const isEditing = taskItem.classList.toggle('editing');

            if (isEditing) {
                titleElement.contentEditable = true;
                titleElement.focus();
                target.textContent = 'Save';
            } else {
                titleElement.contentEditable = false;
                task.title = titleElement.textContent;
                await updateTask(task);
                target.textContent = 'Edit';
            }
        }
    });

    // --- Drag and Drop Reordering ---
    taskListOutput.addEventListener('dragstart', e => {
        if (e.target.classList.contains('task-item')) {
            e.target.classList.add('dragging');
        }
    });

    taskListOutput.addEventListener('dragend', e => {
        if (e.target.classList.contains('task-item')) {
            e.target.classList.remove('dragging');
        }
    });

    taskListOutput.addEventListener('dragover', e => {
        e.preventDefault();
        const draggingItem = document.querySelector('.dragging');
        if (!draggingItem) return;

        const afterElement = getDragAfterElement(taskListOutput, e.clientY);
        if (afterElement == null) {
            taskListOutput.appendChild(draggingItem);
        } else {
            taskListOutput.insertBefore(draggingItem, afterElement);
        }
    });

    taskListOutput.addEventListener('drop', async () => {
        const newOrderedIds = [...taskListOutput.querySelectorAll('.task-item')].map(item => parseInt(item.dataset.id, 10));
        
        // Create a new tasks array in the correct order
        const newTasks = newOrderedIds.map(id => tasks.find(t => t.id === id)).filter(Boolean);
        tasks = newTasks;

        // Update the database. This is a simple approach. For large lists, more optimized updates would be better.
        await Promise.all(tasks.map(task => updateTask(task)));
        renderTasks(); // Re-render to ensure UI is perfectly in sync with the data state
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // --- Initialize ---
    loadTasks();
});

