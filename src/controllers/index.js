const homePage = (req, res) => {
    res.render("home", { title: "Kizuna Rail" });
};

const aboutPage = (req, res) => {
    res.render("about", { title: "About" });
};

const dashboardPage = (req, res) => {
    res.render("dashboard", { title: "Dashboard" });
};

const testErrorPage = (req, res, next) => {
    const err = new Error(
        "This is a test error so you can see what it looks like."
    );
    err.status = 500;
    next(err);
};

const loginPage = (req, res) => {
    res.render("login", { title: "Login" });
};

const registerPage = (req, res) => {
    res.render("register", { title: "Register" });
};

const adminDashboardPage = (req, res) => {
    console.log("Rendering admin dashboard for user:", req.user);
    res.render("admin", { title: "Admin Dashboard" });
};

const adminUsersPage = (req, res) => {
    res.render("users", {
        title: "Admin Users",
        usersEndpoint: "/api/users",
        isAdmin: res.locals.isAdmin,
    });
};

export {
    homePage,
    aboutPage,
    dashboardPage,
    testErrorPage,
    loginPage,
    registerPage,
    adminDashboardPage,
    adminUsersPage,
};
