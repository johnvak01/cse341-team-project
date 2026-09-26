export const adminDashboardPage = (req, res) => {
    console.log('Rendering admin dashboard for user:', req.user);
    res.render('admin', { title: 'Admin Dashboard' });
};
