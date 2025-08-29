import { getTasks, addTask, updateTask, deleteTask } from './idb.js';

document.addEventListener('DOMContentLoaded', async () => {
    const taskListOutput = document.getElementById('task-list');
    const completedTaskListOutput = document.getElementById('completed-task-list');
    const newTaskInput = document.getElementById('new-task-title');
    const addButton = document.getElementById('add-button');
    let tasks = [];

    // --- Render Function ---
    const renderTasks = () => {
        const incompleteTasks = tasks.filter(task => task.status === 'incomplete');
        const completedTasks = tasks.filter(task => task.status === 'complete');

        // Render incomplete tasks
        taskListOutput.innerHTML = '';
        if (incompleteTasks.length === 0) {
            taskListOutput.innerHTML = '<p>No active tasks. Add one!</p>';
        } else {
            incompleteTasks.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';
                taskItem.dataset.id = task.id;
                taskItem.draggable = true;
                taskItem.innerHTML = `
                    <h4 class="task-title">${task.title}</h4>
                    <div class="task-item-nav">
                        <button class="edit-button">Edit</button>
                        <button class="done-button">Done</button>
                        <button class="delete-button">Delete</button>
                    </div>
                `;
                taskListOutput.appendChild(taskItem);
            });
        }

        // Render completed tasks
        completedTaskListOutput.innerHTML = '';
        if (completedTasks.length === 0) {
            completedTaskListOutput.innerHTML = '<p>No completed tasks yet.</p>';
        } else {
            completedTasks.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item done';
                taskItem.dataset.id = task.id;
                taskItem.innerHTML = `
                    <h4 class="task-title">${task.title}</h4>
                    <div class="task-item-nav">
                        <button class="undo-button">Undo</button>
                        <button class="delete-button">Delete</button>
                    </div>
                `;
                completedTaskListOutput.appendChild(taskItem);
            });
        }
    };

    // --- Initial Load ---
    const loadTasks = async () => {
        try {
            tasks = await getTasks();
            if (tasks.length === 0) {
                const response = await fetch('data.json');
                const data = await response.json();
                tasks = data.tasks || [];
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
            newTaskInput.classList.remove('error');
            renderTasks();
        } else {
            newTaskInput.classList.add('error');
            newTaskInput.placeholder = 'Task title cannot be empty!';
        }
    });

    newTaskInput.addEventListener('focus', () => {
        if (newTaskInput.classList.contains('error')) {
            newTaskInput.classList.remove('error');
            newTaskInput.placeholder = 'New Task Title';
        }
    });

    // Combined event listener for both lists
    const handleTaskInteraction = async (e) => {
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

        // Mark Task as Done
        if (target.classList.contains('done-button')) {
            task.status = 'complete';
            await updateTask(task);
            renderTasks();
        }

        // Undo Task
        if (target.classList.contains('undo-button')) {
            task.status = 'incomplete';
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
    };

    taskListOutput.addEventListener('click', handleTaskInteraction);
    completedTaskListOutput.addEventListener('click', handleTaskInteraction);


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
        const completedTasks = tasks.filter(t => t.status === 'complete');
        const newIncompleteTasks = newOrderedIds.map(id => tasks.find(t => t.id === id)).filter(Boolean);
        
        tasks = [...newIncompleteTasks, ...completedTasks];

        await Promise.all(tasks.map(task => updateTask(task)));
        renderTasks();
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
