const home = async (req, res) => { 
    res.render('home/index')
}
export default {
    home,
    async sobre(req, res) {
        res.render('sobre');
    }
};
