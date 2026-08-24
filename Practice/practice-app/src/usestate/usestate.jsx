import { useState } from 'react';

function fruits() {
    let winter = ['orange', 'pomegranate', 'guava']
    let summer = ['mango', 'watermelon', 'peach']
    let spring = ['strawberry', 'cherry', 'apricot']
    const [fruits, setFruits] = useState([winter, summer, spring]);

    function changeSeason(season) {
        setFruits(season);
    }
    return (
        <div>
            <button onClick={() => changeSeason(winter)}>Winter</button>
            <button onClick={() => changeSeason(summer)}>Summer</button>
            <button onClick={() => changeSeason(spring)}>Spring</button>
            <ul>
                {fruits.map((fruit, index) => (
                    <li key={index}>{fruit}</li>
                ))}
            </ul>

        </div>
    )



}
