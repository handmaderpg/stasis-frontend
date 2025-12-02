// CartModule.js - 장바구니 관리

const CartModule = {
    // 장바구니 키
    CART_KEY: 'shopping_cart',
    
    // 장바구니 가져오기
    getCart() {
        const cartStr = localStorage.getItem(this.CART_KEY);
        return cartStr ? JSON.parse(cartStr) : [];
    },
    
    // 장바구니 저장
    saveCart(cart) {
        localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
        this.updateCartCount();
    },
    
    // 아이템 추가 (이미지 URL, 원가, 할인가 추가)
    addItem(gameId, gameName = 'Stasis: Civil War', price = 100, originalPrice = 10000, imageUrl = 'assets/images/game-cover.jpg') {
        const cart = this.getCart();
        
        // 이미 있는지 확인
        const existingItem = cart.find(item => item.gameId === gameId);
        if (existingItem) {
            alert('이미 장바구니에 있는 상품입니다.');
            return;
        }
        
        cart.push({
            gameId,
            gameName,
            price,
            originalPrice,
            imageUrl,
            addedAt: new Date().toISOString()
        });
        
        this.saveCart(cart);
        return cart;
    },
    
    // 아이템 제거
    removeItem(gameId) {
        let cart = this.getCart();
        cart = cart.filter(item => item.gameId !== gameId);
        this.saveCart(cart);
        return cart;
    },
    
    // 장바구니 비우기
    clearCart() {
        localStorage.removeItem(this.CART_KEY);
        this.updateCartCount();
    },
    
    // 총 가격 계산
    getTotalPrice() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + item.price, 0);
    },
    
    // 장바구니 개수 업데이트
    updateCartCount() {
        const countElement = document.getElementById('cart-count');
        if (countElement) {
            const cart = this.getCart();
            countElement.textContent = cart.length;
        }
    },
    
    // 서버와 동기화 (로그인 시)
    async syncWithServer() {
        if (!AuthModule.isLoggedIn()) return;
        
        try {
            // 서버에서 장바구니 가져오기
            const serverCart = await APIClient.get('/api/cart');
            
            // 로컬 장바구니와 합치기
            const localCart = this.getCart();
            const mergedCart = [...serverCart, ...localCart];
            
            // 중복 제거
            const uniqueCart = Array.from(
                new Map(mergedCart.map(item => [item.gameId, item])).values()
            );
            
            // 서버에 업데이트
            await APIClient.post('/api/cart/sync', { items: uniqueCart });
            
            // 로컬 업데이트
            this.saveCart(uniqueCart);
        } catch (error) {
            console.error('Cart sync failed:', error);
        }
    },
    
    // 통화 포맷 (₩)
    formatPrice(value) {
        try {
            return new Intl.NumberFormat('ko-KR', {
                style: 'currency',
                currency: 'KRW',
                maximumFractionDigits: 0
            }).format(value);
        } catch {
            return value + '원';
        }
    },
    
    // 장바구니 팝업 열기
    openCartPopup() {
        this.renderCartPopup();
        const overlay = document.getElementById('cart-overlay');
        if (overlay) {
            overlay.classList.add('open');
        }
    },
    
    // 장바구니 팝업 닫기
    closeCartPopup() {
        const overlay = document.getElementById('cart-overlay');
        if (overlay) {
            overlay.classList.remove('open');
        }
    },
    
    // 팝업 DOM 생성 (최초 한 번)
    ensurePopupDOM() {
        let overlay = document.getElementById('cart-overlay');
        if (overlay) return overlay;
        
        overlay = document.createElement('div');
        overlay.id = 'cart-overlay';
        overlay.className = 'cart-overlay';
        
        overlay.innerHTML = `
            <div class="cart-dropdown">
                <div class="cart-header">
                    <div class="cart-header-title">장바구니</div>
                    <button class="cart-header-close" aria-label="닫기">×</button>
                </div>
                <div class="cart-body">
                    <div class="cart-empty">장바구니가 비어 있습니다.</div>
                    <div class="cart-items"></div>
                </div>
                <div class="cart-footer">
                    <div class="cart-summary">
                        <span>상품 개수: <strong id="cart-summary-count">0개</strong></span>
                        <span>합계: <strong id="cart-summary-total">₩0</strong></span>
                    </div>
                    <div class="cart-footer-buttons">
                        <button class="cart-clear-btn" id="cart-clear-btn">장바구니 비우기</button>
                        <button class="cart-checkout-btn" id="cart-checkout-btn">바로 구매하기</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 오버레이 바깥 클릭 시 닫기
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeCartPopup();
            }
        });
        
        // 닫기 버튼
        const closeBtn = overlay.querySelector('.cart-header-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCartPopup());
        }
        
        // 장바구니 비우기
        const clearBtn = overlay.querySelector('#cart-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('장바구니를 모두 비우시겠습니까?')) {
                    this.clearCart();
                    this.renderCartPopup();
                }
            });
        }
        
        // 바로 구매하기
        const checkoutBtn = overlay.querySelector('#cart-checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const items = this.getCart();
                if (!items.length) {
                    alert('장바구니가 비어 있습니다.');
                    return;
                }
                
                if (!AuthModule.isLoggedIn()) {
                    alert('로그인이 필요합니다.');
                    window.location.href = 'login.html';
                    return;
                }
                
                // 체크된 상품만 추려서 로컬에 저장
                const checked = Array.from(
                    overlay.querySelectorAll('.cart-item-checkbox:checked')
                ).map(input => input.dataset.gameId);
                
                const selectedItems = items.filter(item => checked.includes(item.gameId));
                if (!selectedItems.length) {
                    alert('구매할 상품을 선택하세요.');
                    return;
                }
                
                localStorage.setItem('selected_cart_items', JSON.stringify(selectedItems));
                window.location.href = 'checkout.html';
            });
        }
        
        return overlay;
    },
    
    // 팝업 내용 렌더링
    renderCartPopup() {
        const overlay = this.ensurePopupDOM();
        const cart = this.getCart();
        
        const emptyEl = overlay.querySelector('.cart-empty');
        const itemsContainer = overlay.querySelector('.cart-items');
        const summaryCount = overlay.querySelector('#cart-summary-count');
        const summaryTotal = overlay.querySelector('#cart-summary-total');
        
        if (!itemsContainer) return;
        
        // 초기화
        itemsContainer.innerHTML = '';
        
        if (!cart.length) {
            if (emptyEl) emptyEl.style.display = 'block';
            if (summaryCount) summaryCount.textContent = '0개';
            if (summaryTotal) summaryTotal.textContent = this.formatPrice(0);
            return;
        }
        
        if (emptyEl) emptyEl.style.display = 'none';
        
        cart.forEach(item => {
            const discountRate = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
            
            const row = document.createElement('div');
            row.className = 'cart-item';
            row.innerHTML = `
                <input type="checkbox" class="cart-item-checkbox" data-game-id="${item.gameId}" checked>
                <img src="${item.imageUrl}" alt="${item.gameName}" class="cart-item-image" onerror="this.src='assets/images/game-cover.jpg'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.gameName}</div>
                </div>
                <div class="cart-item-pricing">
                    <span class="cart-item-original-price">${this.formatPrice(item.originalPrice)}</span>
                    <div class="cart-item-discount-wrapper">
                        <span class="cart-item-discount-rate">-${discountRate}%</span>
                        <span class="cart-item-discount-price">${this.formatPrice(item.price)}</span>
                    </div>
                </div>
                <button class="cart-item-remove" data-game-id="${item.gameId}" aria-label="삭제">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                        <path d="M10 11v6M14 11v6"/>
                    </svg>
                </button>
            `;
            itemsContainer.appendChild(row);
        });
        
        // 합계/개수 갱신
        const totalPrice = this.getTotalPrice();
        if (summaryCount) summaryCount.textContent = `${cart.length}개`;
        if (summaryTotal) summaryTotal.textContent = this.formatPrice(totalPrice);
        
        // 삭제 버튼 이벤트 등록
        itemsContainer.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameId = e.currentTarget.dataset.gameId;
                this.removeItem(gameId);
                this.renderCartPopup();
            });
        });
    }
};

// 페이지 로드 시 장바구니 개수 업데이트 + 서버 동기화 + 아이콘 클릭 이벤트
document.addEventListener('DOMContentLoaded', () => {
    CartModule.updateCartCount();
    
    if (AuthModule.isLoggedIn()) {
        CartModule.syncWithServer();
    }
    
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            CartModule.openCartPopup();
        });
    }
});

// 전역으로 사용 가능하게
window.CartModule = CartModule;
