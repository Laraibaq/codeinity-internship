import React, { useState } from 'react';
import { Provider as ReduxProvider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, addItem, removeItem, clearCart } from './store';

function CartListChild() {
  const items = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();

  const totalCost = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="box">
      <h3>Child Component</h3>

      {items.length === 0 ? (
        <p className="status-msg">Your cart is empty.</p>
      ) : (
        <div>
          <div className="cart-summary">
            <span>Total Items: <strong>{items.length}</strong></span>
            <span>Total Cost: <strong>${totalCost.toFixed(2)}</strong></span>
          </div>

          <ul className="cart-list">
            {items.map((item) => (
              <li key={item.id} className="cart-item">
                <span>{`${item.name} - $${item.price.toFixed(2)}`}</span>
                <button
                  type="button"
                  onClick={() => dispatch(removeItem(item.id))}
                  className="danger-btn"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => dispatch(clearCart())}
            className="secondary-btn"
            style={{ marginTop: '10px' }}
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  );
}

function AddItemParentForm() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('');
  const dispatch = useDispatch();

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!name || !price || isNaN(price)) {
      setStatus('Please enter a valid product name and price.');
      return;
    }

    const newItem = {
      id: Date.now(),
      name: name.trim(),
      price: parseFloat(price),
    };

    dispatch(addItem(newItem));
    setName('');
    setPrice('');
    setStatus('Item added to Redux Cart.');
  };

  return (
    <div className="box">
      <h3>Parent Form</h3>
      <form onSubmit={handleAddItem}>
        <label>Product Name:</label>
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setStatus('');
          }}
        />

        <label>Price ($):</label>
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
            setStatus('');
          }}
        />

        <button type="submit">Add to Redux Store</button>
        {status && <p className={`status-msg ${status.includes('Please') ? 'error' : 'success'}`}>{status}</p>}
      </form>
    </div>
  );
}

function ReduxFormDemo() {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<p>Loading persisted cart...</p>} persistor={persistor}>
        <h2>Redux Toolkit Form</h2>
        <AddItemParentForm />
        <CartListChild />
      </PersistGate>
    </ReduxProvider>
  );
}

export default ReduxFormDemo;
