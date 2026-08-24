import { useState } from 'react';
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PendingFn = {
  fn: (x: number) => number;
  label: string;
  needsDeg?: boolean;
};

export default function Index() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [firstNumber, setFirstNumber] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [memory, setMemory] = useState(0);
  const [isDeg, setIsDeg] = useState(true);
  const [pendingFunction, setPendingFunction] = useState<PendingFn | null>(null);
  const [isSecond, setIsSecond] = useState(false);
  const [isScientific, setIsScientific] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);

  // Display font size chhotah ho jata hai jab number lamba ho
  const getFontSize = (text: string) => {
    if (text.length <= 9) return 77;
    if (text.length <= 14) return 52;
    return 36;
  };

  const operatorSymbols: { [key: string]: string } = {
    '+': '+',
    '-': '−',
    '*': '×',
    '/': '÷',
    '^': 'xʸ',
    'EE': '×10^',
    'yroot': 'ʸ√',
  };

  const degToRad = (deg: number) => deg * (Math.PI / 180);

  const resolveDisplay = (): string => {
    if (pendingFunction) {
      const raw = parseFloat(display);
      const input = pendingFunction.needsDeg && isDeg ? degToRad(raw) : raw;
      const value = pendingFunction.fn(input);
      return value.toString();
    }
    return display;
  };

  const handleNumber = (num: string) => {
    const newDisplay = display === '0' ? num : display + num;
    setDisplay(newDisplay);
    if (pendingFunction) {
      setExpression(`${pendingFunction.label}(${newDisplay}`);
    }
  };

  const handleOperator = (op: string) => {
    const resolved = resolveDisplay();
    const label = pendingFunction ? `${pendingFunction.label}(${display})` : resolved;
    setFirstNumber(resolved);
    setOperator(op);
    setExpression(`${label} ${operatorSymbols[op]}`);
    setDisplay('0');
    setPendingFunction(null);
  };

  const handleEqual = () => {
    const resolvedDisplay = resolveDisplay();

    if (!operator) {
      const label = pendingFunction ? `${pendingFunction.label}(${display})` : display;
      setExpression(`${label} =`);
      setDisplay(resolvedDisplay);
      setPendingFunction(null);
      return;
    }

    const num1 = parseFloat(firstNumber || '0');
    const num2 = parseFloat(resolvedDisplay);
    let result = 0;

    if (operator === '+') result = num1 + num2;
    else if (operator === '-') result = num1 - num2;
    else if (operator === '*') result = num1 * num2;
    else if (operator === '/') result = num1 / num2;
    else if (operator === '^') result = Math.pow(num1, num2);
    else if (operator === 'EE') result = num1 * Math.pow(10, num2);
    else if (operator === 'yroot') result = Math.pow(num1, 1 / num2);

    setExpression(`${firstNumber} ${operatorSymbols[operator]} ${resolvedDisplay} =`);
    setDisplay(result.toString());
    setFirstNumber(null);
    setOperator(null);
    setPendingFunction(null);
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setFirstNumber(null);
    setOperator(null);
    setPendingFunction(null);
  };

  const handleDecimal = () => {
    if (!display.includes('.')) setDisplay(display + '.');
  };

  const handlePercent = () => setDisplay((parseFloat(display) / 100).toString());
  const handlePlusMinus = () => setDisplay((parseFloat(display) * -1).toString());

  const handleBackspace = () => {
    if (display.length === 1) setDisplay('0');
    else setDisplay(display.slice(0, -1));
  };

  const handleMC = () => setMemory(0);
  const handleMPlus = () => setMemory(memory + parseFloat(display));
  const handleMMinus = () => setMemory(memory - parseFloat(display));
  const handleMR = () => setDisplay(memory.toString());

  const applyOrDefer = (fn: (x: number) => number, label: string, needsDeg = false) => {
    if (display === '0') {
      setPendingFunction({ fn, label, needsDeg });
      setExpression(`${label}(`);
    } else {
      const raw = parseFloat(display);
      const input = needsDeg && isDeg ? degToRad(raw) : raw;
      const value = fn(input);
      setExpression(`${label}(${display})`);
      setDisplay(value.toString());
    }
  };


  const handleSin = () => isSecond
    ? applyOrDefer((x) => Math.asin(x) * (isDeg ? 180 / Math.PI : 1), 'sin⁻¹')
    : applyOrDefer(Math.sin, 'sin', true);
  const handleCos = () => isSecond
    ? applyOrDefer((x) => Math.acos(x) * (isDeg ? 180 / Math.PI : 1), 'cos⁻¹')
    : applyOrDefer(Math.cos, 'cos', true);
  const handleTan = () => isSecond
    ? applyOrDefer((x) => Math.atan(x) * (isDeg ? 180 / Math.PI : 1), 'tan⁻¹')
    : applyOrDefer(Math.tan, 'tan', true);
  const handleSinh = () => isSecond
    ? applyOrDefer(Math.asinh, 'sinh⁻¹')
    : applyOrDefer(Math.sinh, 'sinh');
  const handleCosh = () => isSecond
    ? applyOrDefer(Math.acosh, 'cosh⁻¹')
    : applyOrDefer(Math.cosh, 'cosh');
  const handleTanh = () => isSecond
    ? applyOrDefer(Math.atanh, 'tanh⁻¹')
    : applyOrDefer(Math.tanh, 'tanh');

  const handleSquare = () => applyOrDefer((x) => Math.pow(x, 2), 'x²');
  const handleCube = () => applyOrDefer((x) => Math.pow(x, 3), 'x³');
  const handleExp = () => applyOrDefer((x) => Math.exp(x), 'eˣ');
  const handle10x = () => applyOrDefer((x) => Math.pow(10, x), '10^');
  const handleReciprocal = () => applyOrDefer((x) => 1 / x, '¹/x');
  const handleSquareRoot = () => applyOrDefer((x) => Math.sqrt(x), '²√');
  const handleCubeRoot = () => applyOrDefer((x) => Math.cbrt(x), '³√');
  const handleLn = () => applyOrDefer((x) => Math.log(x), 'ln');
  const handleLog10 = () => applyOrDefer((x) => Math.log10(x), 'log₁₀');
  const handleFactorial = () =>
    applyOrDefer((x) => {
      let result = 1;
      for (let i = 2; i <= x; i++) result *= i;
      return result;
    }, 'x!');

  const handleYRoot = () => handleOperator('yroot');
  const handleEE = () => handleOperator('EE');

  const handlePi = () => setDisplay(Math.PI.toString());
  const handleE = () => setDisplay(Math.E.toString());
  const handleRand = () => setDisplay(Math.random().toString());

  const handleParenOpen = () => setExpression((prev) => prev + '(');
  const handleParenClose = () => setExpression((prev) => prev + ')');

  return (
    <SafeAreaView style={styles.container}>
      {/* Mode selector menu */}
      <Modal transparent animationType="fade" visible={showModeMenu} onRequestClose={() => setShowModeMenu(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setShowModeMenu(false)}>
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={[styles.menuItem, !isScientific && styles.menuItemActive]}
              onPress={() => { setIsScientific(false); setShowModeMenu(false); handleClear(); }}>
              <Text style={[styles.menuItemText, !isScientific && styles.menuItemTextActive]}>Basic</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={[styles.menuItem, isScientific && styles.menuItemActive]}
              onPress={() => { setIsScientific(true); setShowModeMenu(false); handleClear(); }}>
              <Text style={[styles.menuItemText, isScientific && styles.menuItemTextActive]}>Scientific</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <View style={[styles.displayContainer, { flex: isScientific ? 0.35 : 1.0 }]}>
        {/* Toggle button — hamesha TOP par */}
        <View style={styles.displayHeader}>
          <TouchableOpacity style={styles.sciToggleBtn} onPress={() => setShowModeMenu(true)}>
            <Text style={styles.sciToggleIcon}>≡</Text>
          </TouchableOpacity>
        </View>
        {/* Number display — hamesha BOTTOM par */}
        <View style={styles.displayBottom}>
          <Text style={styles.expressionText} numberOfLines={1}>{expression}</Text>
          <Text style={[styles.displayText, { fontSize: getFontSize(display) }]}>{display}</Text>
        </View>
      </View>

      <View style={[styles.buttonsArea, { flex: isScientific ? 1.25 : 1.0 }]}>

        {/* === SCIENTIFIC ROWS — sirf tab dikhen jab isScientific true ho === */}
        {isScientific && (
          <>
            {/* Sci Row 1: ( ) mc m+ m- mr */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.sciButton} onPress={handleParenOpen}><Text style={styles.sciButtonText}>(</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleParenClose}><Text style={styles.sciButtonText}>)</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleMC}><Text style={styles.sciButtonText}>mc</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleMPlus}><Text style={styles.sciButtonText}>m+</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleMMinus}><Text style={styles.sciButtonText}>m-</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleMR}><Text style={styles.sciButtonText}>mr</Text></TouchableOpacity>
            </View>

            {/* Sci Row 2: 2nd x² x³ xʸ eˣ 10ˣ */}
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.sciButton, isSecond && styles.sciButtonActive]}
                onPress={() => setIsSecond(!isSecond)}>
                <Text style={[styles.sciButtonText, isSecond && styles.sciButtonActiveText]}>2nd</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleSquare}><Text style={styles.sciButtonText}>x²</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleCube}><Text style={styles.sciButtonText}>x³</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={() => handleOperator('^')}><Text style={styles.sciButtonText}>xʸ</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleExp}><Text style={styles.sciButtonText}>eˣ</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handle10x}><Text style={styles.sciButtonText}>10ˣ</Text></TouchableOpacity>
            </View>

            {/* Sci Row 3: ¹/x ²√x ³√x ʸ√x ln log₁₀ */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.sciButton} onPress={handleReciprocal}><Text style={styles.sciButtonText}>¹/x</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleSquareRoot}><Text style={styles.sciButtonText}>²√x</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleCubeRoot}><Text style={styles.sciButtonText}>³√x</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleYRoot}><Text style={styles.sciButtonText}>ʸ√x</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleLn}><Text style={styles.sciButtonText}>ln</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleLog10}><Text style={styles.sciButtonText}>log₁₀</Text></TouchableOpacity>
            </View>

            {/* Sci Row 4: x! sin cos tan e EE */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.sciButton} onPress={handleFactorial}><Text style={styles.sciButtonText}>x!</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleSin}>
                <Text style={styles.sciButtonText}>{isSecond ? 'sin⁻¹' : 'sin'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleCos}>
                <Text style={styles.sciButtonText}>{isSecond ? 'cos⁻¹' : 'cos'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleTan}>
                <Text style={styles.sciButtonText}>{isSecond ? 'tan⁻¹' : 'tan'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleE}><Text style={styles.sciButtonText}>e</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleEE}><Text style={styles.sciButtonText}>EE</Text></TouchableOpacity>
            </View>

            {/* Sci Row 5: Rand sinh cosh tanh π Deg/Rad */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.sciButton} onPress={handleRand}><Text style={styles.sciButtonText}>Rand</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleSinh}>
                <Text style={styles.sciButtonText}>{isSecond ? 'sinh⁻¹' : 'sinh'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleCosh}>
                <Text style={styles.sciButtonText}>{isSecond ? 'cosh⁻¹' : 'cosh'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handleTanh}>
                <Text style={styles.sciButtonText}>{isSecond ? 'tanh⁻¹' : 'tanh'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={handlePi}><Text style={styles.sciButtonText}>π</Text></TouchableOpacity>
              <TouchableOpacity style={styles.sciButton} onPress={() => setIsDeg(!isDeg)}>
                <Text style={styles.sciButtonText}>{isDeg ? 'Deg' : 'Rad'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Standard Row: AC +/- % ÷ */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.topButton} onPress={handleClear}><Text style={styles.topButtonText}>AC</Text></TouchableOpacity>
          <TouchableOpacity style={styles.topButton} onPress={handlePlusMinus}><Text style={styles.topButtonText}>+/-</Text></TouchableOpacity>
          <TouchableOpacity style={styles.topButton} onPress={handlePercent}><Text style={styles.topButtonText}>%</Text></TouchableOpacity>
          <TouchableOpacity style={styles.operatorButton} onPress={() => handleOperator('/')}><Text style={styles.operatorButtonText}>÷</Text></TouchableOpacity>
        </View>

        {/* 7 8 9 × */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={() => handleNumber('7')}><Text style={styles.buttonText}>7</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleNumber('8')}><Text style={styles.buttonText}>8</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleNumber('9')}><Text style={styles.buttonText}>9</Text></TouchableOpacity>
          <TouchableOpacity style={styles.operatorButton} onPress={() => handleOperator('*')}><Text style={styles.operatorButtonText}>×</Text></TouchableOpacity>
        </View>

        {/* 4 5 6 − */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={() => handleNumber('4')}><Text style={styles.buttonText}>4</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleNumber('5')}><Text style={styles.buttonText}>5</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleNumber('6')}><Text style={styles.buttonText}>6</Text></TouchableOpacity>
          <TouchableOpacity style={styles.operatorButton} onPress={() => handleOperator('-')}><Text style={styles.operatorButtonText}>−</Text></TouchableOpacity>
        </View>

        {/* 1 2 3 + */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={() => handleNumber('1')}><Text style={styles.buttonText}>1</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleNumber('2')}><Text style={styles.buttonText}>2</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleNumber('3')}><Text style={styles.buttonText}>3</Text></TouchableOpacity>
          <TouchableOpacity style={styles.operatorButton} onPress={() => handleOperator('+')}><Text style={styles.operatorButtonText}>+</Text></TouchableOpacity>
        </View>

        {/* ⌫ 0 . = */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={handleBackspace}><Text style={styles.buttonText}>⌫</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleNumber('0')}><Text style={styles.buttonText}>0</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleDecimal}><Text style={styles.buttonText}>.</Text></TouchableOpacity>
          <TouchableOpacity style={styles.operatorButton} onPress={handleEqual}><Text style={styles.operatorButtonText}>=</Text></TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 },
  displayContainer: { flex: 0.35, paddingHorizontal: 10, paddingTop: 4, paddingBottom: 10 },
  displayHeader: { flexDirection: 'row', alignItems: 'center' },
  // Number aur expression hamesha neeche rahe
  displayBottom: { flex: 1, justifyContent: 'flex-end' },
  sciToggleBtn: { padding: 4 },
  sciToggleIcon: { color: '#ff9500', fontSize: 22, fontWeight: '700' },
  expressionText: { color: '#888', fontSize: 14, textAlign: 'right' },
  displayText: { color: '#fff', fontWeight: '300', textAlign: 'right' },
  buttonsArea: { flex: 1.25 },
  row: { flex: 1, flexDirection: 'row', gap: 7, marginBottom: 7 },
  button: { flex: 1, backgroundColor: '#333', borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  topButton: { flex: 1, backgroundColor: '#a5a5a5', borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  operatorButton: { flex: 1, backgroundColor: '#ff9500', borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  sciButton: { flex: 1, backgroundColor: '#1c1c1e', borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  sciButtonActive: { backgroundColor: '#ff9500' },
  buttonText: { color: '#fff', fontSize: 20 },
  topButtonText: { color: '#000', fontSize: 16, fontWeight: '500' },
  operatorButtonText: { color: '#fff', fontSize: 22 },
  sciButtonText: { color: '#fff', fontSize: 15 },
  sciButtonActiveText: { color: '#fff', fontWeight: '700' },
  // Modal menu styles
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menuBox: {
    position: 'absolute', top: 48, left: 16,
    backgroundColor: '#1c1c1e', borderRadius: 14,
    overflow: 'hidden', minWidth: 160,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 10,
  },
  menuItem: { paddingVertical: 14, paddingHorizontal: 20 },
  menuItemActive: { backgroundColor: '#2c2c2e' },
  menuItemText: { color: '#aaa', fontSize: 16 },
  menuItemTextActive: { color: '#ff9500', fontWeight: '600' },
  menuDivider: { height: 1, backgroundColor: '#333' },
});