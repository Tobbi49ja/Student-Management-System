
        document.getElementById('switch-to-login').addEventListener('click', function(e) {
            e.preventDefault();
            const loginCard = document.querySelector('.auth-card:first-child');
            const signupCard = document.querySelector('.auth-card:last-child');
            
            loginCard.style.display = 'block';
            signupCard.style.display = 'none';
        });