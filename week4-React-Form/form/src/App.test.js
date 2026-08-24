import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders router navigation links', () => {
  render(<App />);
  
  expect(screen.getByRole('link', { name: /Local Storage/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Context API/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Redux Toolkit/i })).toBeInTheDocument();
});

test('LocalStorage feedback form saves and retrieves data', () => {
  render(<App />);
  
  const nameInput = screen.getByPlaceholderText('Full Name');
  const emailInput = screen.getByPlaceholderText('Email Address');
  const saveBtn = screen.getByRole('button', { name: /Save to Local Storage/i });

  fireEvent.change(nameInput, { target: { value: 'Alex Morgan' } });
  fireEvent.change(emailInput, { target: { value: 'alex@example.com' } });
  fireEvent.click(saveBtn);

  expect(screen.getByText(/Feedback saved to Local Storage./i)).toBeInTheDocument();

  const retrieveBtn = screen.getByRole('button', { name: /Retrieve Saved Feedback/i });
  fireEvent.click(retrieveBtn);

  expect(screen.getByText(/Alex Morgan/i)).toBeInTheDocument();
  expect(screen.getByText(/alex@example.com/i)).toBeInTheDocument();
});

test('Context API form updates global settings and theme', () => {
  render(<App />);
  
  fireEvent.click(screen.getByRole('link', { name: /Context API/i }));

  const usernameInput = screen.getByDisplayValue('GuestUser');
  const updateBtn = screen.getByRole('button', { name: /Save to Context/i });

  fireEvent.change(usernameInput, { target: { value: 'JohnDoe99' } });
  fireEvent.click(updateBtn);

  expect(screen.getByText(/Context updated successfully./i)).toBeInTheDocument();
  expect(screen.getByText(/JohnDoe99/i)).toBeInTheDocument();
});

test('Redux Toolkit form adds product to cart and updates summary', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('link', { name: /Redux Toolkit/i }));

  const nameInput = screen.getByPlaceholderText('Product Name');
  const priceInput = screen.getByPlaceholderText('Price');
  const addBtn = screen.getByRole('button', { name: /Add to Redux Store/i });

  fireEvent.change(nameInput, { target: { value: 'Gaming Keyboard' } });
  fireEvent.change(priceInput, { target: { value: '79.99' } });
  fireEvent.click(addBtn);

  expect(screen.getByText(/Item added to Redux Cart./i)).toBeInTheDocument();
  expect(screen.getByText('Gaming Keyboard - $79.99')).toBeInTheDocument();
});
