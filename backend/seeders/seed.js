const { Category, Task, User } = require("../models");
const bcrypt = require("bcryptjs");

const seed = async () => {
  try {
    await Category.bulkCreate([
      { name: "Сделать" },
      { name: "В процессе" },
      { name: "Готово" },
    ]);

    const hashedPassword = await bcrypt.hash("password", 10);
    const user = await User.create({
      username: "testuser",
      password: hashedPassword,
    });

    await Task.bulkCreate([
      {
        title: "Настроить Backend",
        description: "Создать структуру проекта, установить зависимости",
        priority: "high",
        CategoryId: 1,
        UserId: user.id,
      },
      {
        title: "Создать модели",
        description: "Описать модели User, Task, Category",
        priority: "high",
        CategoryId: 1,
        UserId: user.id,
      },
      {
        title: "Реализовать аутентификацию",
        description: "Создать эндпоинты для регистрации и логина",
        priority: "high",
        CategoryId: 2,
        UserId: user.id,
      },
      {
        title: "Реализовать CRUD для задач",
        description: "Создать эндпоинты для задач",
        priority: "medium",
        CategoryId: 2,
        UserId: user.id,
      },
      {
        title: "Настроить Frontend",
        description: "Создать структуру проекта, установить зависимости",
        priority: "medium",
        CategoryId: 3,
        UserId: user.id,
      },
      {
        title: "Создать компоненты",
        description: "Создать компоненты для доски, колонок и задач",
        priority: "low",
        CategoryId: 3,
        UserId: user.id,
      },
      {
        title: "Интегрировать drag-and-drop",
        description: "Подключить react-beautiful-dnd",
        priority: "low",
        CategoryId: 1,
        UserId: user.id,
      },
      {
        title: "Реализовать UI",
        description: "Создать UI для приоритетов, дедлайнов, фильтрации и поиска",
        priority: "low",
        CategoryId: 1,
        UserId: user.id,
      },
      {
        title: "Обеспечить адаптивность",
        description: "Сделать интерфейс адаптивным",
        priority: "low",
        CategoryId: 2,
        UserId: user.id,
      },
      {
        title: "Написать Dockerfile",
        description: "Написать Dockerfile для backend и frontend",
        priority: "medium",
        CategoryId: 3,
        UserId: user.id,
      },
    ]);
    console.log("Seed data created successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};

seed();
