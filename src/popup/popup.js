const lightThemeBtn = document.getElementById('lightTheme')
const darkThemeBtn = document.getElementById('darkTheme')
const body = document.body

lightThemeBtn.addEventListener('click', () => {
    body.style.background = 'linear-gradient(135deg, #5d8bf7, #a3c1fc)'
    body.style.color = '#fff'
    lightThemeBtn.classList.add('active')
    darkThemeBtn.classList.remove('active')
});

darkThemeBtn.addEventListener('click', () => {
    body.style.background = 'linear-gradient(135deg, #1e1e1e, #3a3a3a)'
    body.style.color = '#ccc'
    darkThemeBtn.classList.add('active')
    lightThemeBtn.classList.remove('active')
});