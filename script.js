import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userStatusDiv = document.getElementById('user-status');
    const taskListOutput = document.getElementById('task-list');
    const completedTaskListOutput = document.getElementById('completed-task-list');
    const newTaskInput = document.getElementById('new-task-title');
    const addButton = document.getElementById('add-button');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    let tasks = [];
    let user = null;

    // --- Auth State Change ---
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (session) {
        user = session.user;
        handleLoggedIn();
    } else {
        handleLoggedOut();
    }

    supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
            user = session.user;
            handleLoggedIn();
        } else {
            user = null;
            handleLoggedOut();
        }
    });

    function handleLoggedIn() {
        userStatusDiv.innerHTML = `
            <div class="user-menu">
                <span class="user-email">${user.email}</span>
                <div class="user-menu-content">
                    <button id="delete-account-btn">Delete Account</button>
                </div>
            </div>
            <button id="logout-button">Logout</button>
        `;

        document.getElementById('logout-button').addEventListener('click', async () => {
            await supabase.auth.signOut();
            // The onAuthStateChange listener below will handle the redirect.
        });

        document.getElementById('delete-account-btn').addEventListener('click', () => {
            deleteConfirmModal.style.display = 'flex';
        });

        loadTasks();
    }

    function handleLoggedOut() {
        // This script runs on dashboard.html. If the user is logged out,
        // they should be redirected to the login page (index.html).
        window.location.href = 'index.html';
    }

    // --- Render Function ---
    function renderTasks() {
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

                const title = document.createElement('h4');
                title.className = 'task-title';
                title.textContent = task.title; // Safely set text content

                const nav = document.createElement('div');
                nav.className = 'task-item-nav';
                nav.innerHTML = `
                    <button class="edit-button">Edit</button>
                    <button class="done-button">Done</button>
                    <button class="delete-button">Delete</button>
                `;

                taskItem.appendChild(title);
                taskItem.appendChild(nav);
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

                const title = document.createElement('h4');
                title.className = 'task-title';
                title.textContent = task.title; // Safely set text content

                const nav = document.createElement('div');
                nav.className = 'task-item-nav';
                nav.innerHTML = `
                    <button class="undo-button">Undo</button>
                    <button class="delete-button">Delete</button>
                `;

                taskItem.appendChild(title);
                taskItem.appendChild(nav);
                completedTaskListOutput.appendChild(taskItem);
            });
        }
    };

    // --- Initial Load ---
    async function loadTasks() {
        try {
            // Only select tasks belonging to the current user
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;
            tasks = data || [];
            renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            taskListOutput.innerHTML = '<p>Error loading data.</p>';
        }
    }

    // --- Event Listeners ---

    // Add a new task
    addButton.addEventListener('click', async () => {
        const title = newTaskInput.value.trim();
        if (title) {
            const { data, error } = await supabase
                .from('tasks')
                .insert([{ title, status: 'incomplete' }])
                .select();

            if (error) {
                console.error('Error adding task:', error);
                return;
            }
            
            if (data) {
                tasks.push(data[0]);
            }
            
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

    // Add task on Enter key press
    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission if it were in a form
            addButton.click(); // Trigger the add button's click event
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
            const { error } = await supabase.from('tasks').delete().match({ id });
            if (error) {
                console.error('Error deleting task:', error);
            } else {
                tasks = tasks.filter(t => t.id !== id);
                renderTasks();
            }
        }

        // Mark Task as Done
        if (target.classList.contains('done-button')) {
            task.status = 'complete';
            const { error } = await supabase.from('tasks').update({ status: 'complete' }).match({ id });
            if (error) console.error('Error updating task:', error);
            else renderTasks();
        }

        // Undo Task
        if (target.classList.contains('undo-button')) {
            task.status = 'incomplete';
            const { error } = await supabase.from('tasks').update({ status: 'incomplete' }).match({ id });
            if (error) console.error('Error updating task:', error);
            else renderTasks();
        }

        // Edit Task
        if (target.classList.contains('edit-button')) {
            const titleElement = taskItem.querySelector('.task-title');

            const saveChanges = async () => {
                titleElement.contentEditable = false;
                taskItem.classList.remove('editing'); // Explicitly remove class
                const newTitle = titleElement.textContent.trim();

                if (newTitle && newTitle !== task.title) {
                    const { error } = await supabase.from('tasks').update({ title: newTitle }).match({ id });
                    if (error) {
                        console.error('Error updating task:', error);
                        titleElement.textContent = task.title; // Revert on error
                    } else {
                        task.title = newTitle;
                    }
                } else {
                    // If title is empty or unchanged, just revert to original
                    titleElement.textContent = task.title;
                }

                target.textContent = 'Edit';
                titleElement.removeEventListener('keydown', handleKeydown);
            };

            const handleKeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveChanges();
                } else if (e.key === 'Escape') {
                    titleElement.textContent = task.title; // Revert changes
                    saveChanges(); // Exit edit mode
                }
            };

            if (!taskItem.classList.contains('editing')) {
                // --- ENTERING EDIT MODE ---
                taskItem.classList.add('editing');
                titleElement.contentEditable = true;
                
                // Select text for easy replacement
                const range = document.createRange();
                range.selectNodeContents(titleElement);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                
                titleElement.focus();
                target.textContent = 'Save';

                titleElement.addEventListener('keydown', handleKeydown);
            } else {
                // --- EXITING EDIT MODE (via Save button click) ---
                saveChanges();
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

        // In a real app, you'd likely want to update a 'position' or 'order' column in the DB
        // For simplicity, we are not persisting the order here.
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

    // --- Modal Event Listeners ---
    cancelDeleteBtn.addEventListener('click', () => {
        deleteConfirmModal.style.display = 'none';
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        try {
            // Supabase doesn't have a direct "delete user" client-side function
            // for security reasons. This requires a server-side call.
            // We will create a Supabase Edge Function for this.
            const { error } = await supabase.functions.invoke('delete-user');

            if (error) throw error;

            alert('Account deleted successfully.');
            await supabase.auth.signOut();
            // The onAuthStateChange listener will handle the redirect.
            deleteConfirmModal.style.display = 'none';

        } catch (error) {
            console.error('Error deleting account:', error);
            alert(`Failed to delete account: ${error.message}`);
            deleteConfirmModal.style.display = 'none';
        }
    });

    // --- Initialize ---
    // No initial load needed here, it's handled by the auth state change listener
});
