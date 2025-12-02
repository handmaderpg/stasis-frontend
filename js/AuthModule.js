// AuthModule.js - 인증 관리

const AuthModule = {
    // 로그인 상태 확인
    isLoggedIn() {
        return !!localStorage.getItem('auth_token');
    },
    
    // 현재 사용자 정보 가져오기
    getCurrentUser() {
        const userStr = localStorage.getItem('user_info');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    // 사용자 정보 저장
    setUser(user, token) {
        localStorage.setItem('user_info', JSON.stringify(user));
        localStorage.setItem('auth_token', token);
        this.updateUI();
    },
    
    // 로그인
    async login(email, password) {
        try {
            const response = await APIClient.post('/api/auth/login', {
                email,
                password
            });
            
            this.setUser(response.user, response.token);
            return response;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },
    
    // 회원가입
    async register(email, password, username) {
        try {
            const response = await APIClient.post('/api/auth/register', {
                email,
                password,
                username
            });
            
            this.setUser(response.user, response.token);
            return response;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    },
    
    // 로그아웃
    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        this.updateUI();
        window.location.href = 'index.html';
    },
    
    // UI 업데이트
    updateUI() {
        const authBtn = document.getElementById('auth-btn');
        if (!authBtn) return;
        
        if (this.isLoggedIn()) {
            const user = this.getCurrentUser();
            const username = user.username || user.email;
            
            // 사용자 메뉴로 변경
            authBtn.outerHTML = `
                <div class="user-menu" id="user-menu">
                    <button class="user-menu-btn" id="user-menu-btn">
                        ${username}
                    </button>
                    <div class="user-dropdown">
                        <a href="library.html">
                            <span class="user-dropdown-icon">📚</span>
                            마이페이지
                        </a>
                        <button id="logout-btn">
                            <span class="user-dropdown-icon">🚪</span>
                            로그아웃
                        </button>
                    </div>
                </div>
            `;
            
            // 드롭다운 토글 이벤트
            const userMenuBtn = document.getElementById('user-menu-btn');
            const userMenu = document.getElementById('user-menu');
            
            if (userMenuBtn && userMenu) {
                userMenuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userMenu.classList.toggle('active');
                });
                
                // 외부 클릭 시 드롭다운 닫기
                document.addEventListener('click', () => {
                    userMenu.classList.remove('active');
                });
            }
            
            // 로그아웃 버튼 이벤트
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('로그아웃하시겠습니까?')) {
                        this.logout();
                    }
                });
            }
        } else {
            // 로그인 전 상태
            authBtn.outerHTML = '<a href="login.html" class="login-btn" id="auth-btn">로그인</a>';
        }
    },
    
    // 관리자 권한 확인
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }
};

// 페이지 로드 시 UI 업데이트
document.addEventListener('DOMContentLoaded', () => {
    AuthModule.updateUI();
});

// 전역으로 사용 가능하게
window.AuthModule = AuthModule;
