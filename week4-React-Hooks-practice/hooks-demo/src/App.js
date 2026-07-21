import React, { useState, useEffect, useMemo, useCallback, useReducer, useLayoutEffect, useRef, memo } from 'react';

// 1. useState
// Problem: when we use variables to update a state, they are just saved in memory, but they do not update the ui
// solution: by using usestate hook, ui is also updated, and each update is shown on screen

function Counter() {
  let count = 0;
  console.log('Counter rendered count is:', count);
  return (
    <div>
      <p>Broken Count: {count}</p>
      <button onClick={() => { count = count + 1; console.log('clicked ; count in memory:', count, '— UI will NOT update'); }}>Increment</button>
    </div>
  );
}

function CounterFixed() {
  const [count, setCount] = useState(0);
  console.log('CounterFixed rendered count is:', count);
  return (
    <div>
      <p> Fixed Count: {count}</p>
      <button onClick={() => { setCount(count + 1); console.log('setCount called, React will re-render'); }}>Increment</button>
    </div>
  );
}

// 2. useEffect
// Problem: on every render, the api is called again and again, more costly 
// Fix: useEffect with [] runs the function and call api only once, when component is created and appears on screen

function UserFetcher() {
  let user = null;
  console.log('UserFetcher rendered , fetch is called RIGHT NOW (every render!)');
  fetch('https://jsonplaceholder.typicode.com/users/1')
    .then(res => res.json())
    .then(data => { user = data; console.log('fetch done but UI will NOT update:', data.name); });
  return <p>Broken User: {user ? user.name : 'never loads'}</p>;
}

function UserFetcherFixed() {
  const [user, setUser] = useState(null);
  console.log('UserFetcherFixed rendered, user:', user);
  useEffect(() => {
    console.log('useEffect fired, fetch runs only once after mount');
    fetch('https://jsonplaceholder.typicode.com/users/1')
      .then(res => res.json())
      .then(data => { console.log('fetch resolved, updating state:', data.name); setUser(data); });
  }, []);
  return <p>Fixed,User: {user ? user.name : 'loading...'}</p>;
}

// 3. useMemo
// Problem: calculates everytime the function is called, heavy calculations so costly
// Fix: useMemo caches the result and only recalculates when dependencies change

function heavyCalculation(n) {
  console.log('heavyCalculation STARTED ');
  let result = 0;
  for (let i = 0; i < 100_000_000; i++) result += i % n;
  console.log('heavyCalculation DONE, result:', result);
  return result;
}

function PrimeCalculator() {
  const [name, setName] = useState('Laraib');
  console.log('PrimeCalculator rendered ');
  const result = heavyCalculation(7);
  return (
    <div>
      <p>Broken, typing triggers heavy recalculation</p>
      <input value={name} onChange={e => setName(e.target.value)} />
      <p>Result: {result}</p>
    </div>
  );
}

function PrimeCalculatorFixed() {
  const [name, setName] = useState('Laraib');
  console.log('PrimeCalculatorFixed rendered, useMemo will return cached value');
  const result = useMemo(() => heavyCalculation(7), []); //  cached
  return (
    <div>
      <p>Fixed,typing does NOT retrigger the calculation</p>
      <input value={name} onChange={e => setName(e.target.value)} />
      <p>Result: {result}</p>
    </div>
  );
}

// 4. useCallback
// Problem: we'have a child that has memoization, and we call a function from parent to child, so child gets re-rendered which it shouldn't have
// Fix: useCallback make the child to skip the re-renders unless parent changes the dependency

const ChildButton = React.memo(function ChildButton({ onClick }) {
  console.log('useCallback is missing');
  return <button onClick={onClick}>Child button</button>;
});

function ParentWithCallback() {
  const [count, setCount] = useState(0);
  const handleClick = () => setCount(c => c + 1);
  console.log('useCallback is missing which causes child re-render on every parent render');
  return (
    <div>
      <p>child re-renders on every parent render</p>
      <p>Count: {count}</p>
      <ChildButton onClick={handleClick} />
    </div>
  );
}

function ParentWithCallbackFixed() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => setCount(c => c + 1), []);
  console.log('ChildButton will skip re-render');
  return (
    <div>
      <p>Count: {count}</p>
      <ChildButton onClick={handleClick} />
    </div>
  );
}

// 5. useReducer
// Problem: sometimes we have to use many states, for updating one state we have to update all the states
//fix: to solve this problem, we can use usereducer() which allows us to update all the states from one place without unnecessary complexity

function WithoutUseReducer() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  function increment() {
    console.log("incrementing:", count, "+", step, "=", count + step);
    setCount(count + step);
  }

  return (
    <>
      <p>count: {count} | step: {step}</p>
      <button onClick={increment}>increment</button>
      <button onClick={() => setStep(s => s + 1)}>step up</button>
    </>
  );
}

function countReducer(state, action) {
  console.log("action:", action.type, "| state before:", state);
  switch (action.type) {
    case "increment": return { ...state, count: state.count + state.step };
    case "stepUp": return { ...state, step: state.step + 1 };
    case "reset": return { count: 0, step: 1 };
    default: return state;
  }
}

function WithUseReducer() {
  const [state, dispatch] = useReducer(countReducer, { count: 0, step: 1 });

  console.log("rendered, state:", state);

  return (
    <>
      <p>count: {state.count} | step: {state.step}</p>
      <button onClick={() => dispatch({ type: "increment" })}>increment</button>
      <button onClick={() => dispatch({ type: "stepUp" })}>step up</button>
      <button onClick={() => dispatch({ type: "reset" })}>reset</button>
      <small>(watch console, reducer logs every action and new state)</small>
    </>
  );
}

//  React.memo
// problem: child re-renders every time parent updates even if props are the same which causes unnecessary re renders of child making it ineffecient
//fix: fixed by react.memo that allows us only render the child if the props are changed, it does shallow comparision which goes only one level deep

function GreetingNoMemo({ name }) {
  console.log("GreetingNoMemo rendered, name:", name, "props didn't change, still ran");
  return <p>hello, {name}</p>;
}

function ParentNoMemo() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>re-render parent ({count})</button>
      <GreetingNoMemo name="Laraib" />
      <small>(watch console, greeting logs on every click)</small>
    </>
  );
}

const GreetingWithMemo = memo(function GreetingWithMemo({ name }) {
  console.log("GreetingWithMemo rendered, name:", name, "only runs when name actually changes");
  return <p>hello, {name}</p>;
});

function ParentWithMemo() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>re-render parent ({count})</button>
      <GreetingWithMemo name="Laraib" />
      <small>(greeting does not log on clicks)</small>
    </>
  );
}

// 6. useLayoutEffect
// problem: UI flickering: it occurs when u dont know the dimensions of the element or u want to do something after the dom is painted, it can cause a flicker in the UI, if done with useeffect() can cause the ui to be in wrong format for a moment and then suddenly correct
// fix: by using uselayouteffect u can measure the dimensions of the element before the dom is painted so that the ui is always in the correct format and no flicker is observed 

function WithoutUseLayoutEffect() {
  const [width, setWidth] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    console.log("(useEffect) read width AFTER paint:", ref.current.offsetWidth, "px — flicker already happened");
    setWidth(ref.current.offsetWidth);
  }, []);

  return <p ref={ref}>width (may flicker): {width}px</p>;
}

function WithUseLayoutEffect() {
  const [width, setWidth] = useState(0);
  const ref = useRef(null);

  useLayoutEffect(() => {
    console.log("(useLayoutEffect) read width BEFORE paint:", ref.current.offsetWidth, "px — no flicker");
    setWidth(ref.current.offsetWidth);
  }, []);

  return <p ref={ref}>width (no flicker): {width}px</p>;
}

// demonstration of state uplifting
function Sibling1({ onSend }) {
  const fetchData = async () => {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts/1");
    const data = await res.json();
    onSend(data);
  };

  return <button onClick={fetchData}>Fetch Post</button>;
}

function Sibling2({ data }) {
  if (!data) return <p>No data yet.</p>;
  return <p><b>{data.title}</b></p>;
}

function Parent() {
  const [data, setData] = useState(null);

  return (
    <div>
      <Sibling1 onSend={setData} />
      <Sibling2 data={data} />
    </div>
  );
}

// App

function App() {
  return (
    <div>
      <h1>React Hooks: Problem vs Solution</h1>

      <h2>1. useState</h2>
      <Counter />
      <CounterFixed />
      <hr />

      <h2>2. useEffect</h2>
      <UserFetcher />
      <UserFetcherFixed />
      <hr />

      <h2>3. useMemo</h2>
      <PrimeCalculator />
      <PrimeCalculatorFixed />
      <hr />

      <h2>4. useCallback</h2>
      <ParentWithCallback />
      <ParentWithCallbackFixed />
      <hr />

      <h2>5. useReducer</h2>
      <WithoutUseReducer />
      <WithUseReducer />
      <hr />

      <h2>6. React.memo</h2>
      <ParentNoMemo />
      <ParentWithMemo />
      <hr />

      <h2>7. useLayoutEffect</h2>
      <WithoutUseLayoutEffect />
      <WithUseLayoutEffect />
      <hr />

      <h2>8. State Uplifting</h2>
      <Parent />
    </div>
  );
}

export default App;
