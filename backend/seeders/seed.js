const { Category, Task } = require("../models");

const seed = async () => {
  try {
    await Category.bulkCreate([
      { name: "Сделать" },
      { name: "В процессе" },
      { name: "Готово" },
    ]);
    await Task.bulkCreate([
      {
        title: "Настроить Backend",
        description: "Создать структуру проекта, установить зависимости",
        priority: "high",
        CategoryId: 1,
      },
      {
        title: "Создать модели",
        description: "Описать модели User, Task, Category",
        priority: "high",
        CategoryId: 1,
      },
      {
        title: "Реализовать аутентификацию",
        description: "Создать эндпоинты для регистрации и логина",
        priority: "high",
        CategoryId: 2,
      },
      {
        title: "Реализовать CRUD для задач",
        description: "Создать эндпоинты для задач",
        priority: "medium",
        CategoryId: 2,
      },
      {
        title: "Настроить Frontend",
        description: "Создать структуру проекта, установить зависимости",
        priority: "medium",
        CategoryId: 3,
      },
      {
        title: "Создать компоненты",
        description: "Создать компоненты для доски, колонок и задач",
        priority: "low",
        CategoryId: 3,
      },
      {
        title: "Интегрировать drag-and-drop",
        description: "Подключить react-beautiful-dnd",
        priority: "low",
        CategoryId: 1,
      },
      {
        title: "Реализовать UI",
        description: "Создать UI для приоритетов, дедлайнов, фильтрации и поиска",
        priority: "low",
        CategoryId: 1,
      },
      {
        title: "Обеспечить адаптивность",
        description: "Сделать интерфейс адаптивным",
        priority: "low",
        CategoryId: 2,
      },
      {
        title: "Написать Dockerfile",
        description: "Написать Dockerfile для backend и frontend",
        priority: "medium",
        CategoryId: 3,
      },
    ]);
    console.log("Seed data created successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};

seed();
