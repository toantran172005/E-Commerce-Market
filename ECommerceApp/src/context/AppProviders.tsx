import React, { ReactNode, useState } from 'react';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { FavouritesProvider } from './FavouritesContext';
import { AddressesProvider } from './AddressesContext';
import { PaymentMethodsProvider } from './PaymentMethodsContext';
import { NotificationsProvider } from './NotificationsContext';
import { SettingsProvider } from './SettingsContext';
import { OrdersProvider } from './OrdersContext';
import { CheckoutProvider } from './CheckoutContext';
import { ProductFilterProvider } from './ProductFilterContext';

/**
 * Gộp toàn bộ Provider theo thứ tự phụ thuộc:
 * - Auth ngoài cùng (mọi context con đều dùng được useAuth).
 * - Cart trước Orders (OrdersContext dùng useCart để mua lại).
 * - Checkout trong cùng vì nó gọi useCart + useOrders + useNotifications + ...
 */
export function AppProviders({ children }: { children: ReactNode }) {
  // Khi logout, bump resetKey để các context reset dữ liệu người dùng.
  const [resetKey, setResetKey] = useState(0);
  const handleLogout = () => setResetKey((key) => key + 1);

  return (
    <AuthProvider onLogout={handleLogout}>
      <NotificationsProvider resetKey={resetKey}>
        <CartProvider resetKey={resetKey}>
          <FavouritesProvider resetKey={resetKey}>
            <AddressesProvider resetKey={resetKey}>
              <PaymentMethodsProvider resetKey={resetKey}>
                <SettingsProvider resetKey={resetKey}>
                  <OrdersProvider resetKey={resetKey}>
                    <CheckoutProvider resetKey={resetKey}>
                      <ProductFilterProvider>{children}</ProductFilterProvider>
                    </CheckoutProvider>
                  </OrdersProvider>
                </SettingsProvider>
              </PaymentMethodsProvider>
            </AddressesProvider>
          </FavouritesProvider>
        </CartProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}
