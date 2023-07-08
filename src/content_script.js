function extractTimeData(element) {
    const hourElement = element.querySelector('.hour-min__hour .hour-min__value');
    const minElement = element.querySelector('.hour-min__min .hour-min__value');

    const hours = hourElement ? parseInt(hourElement.innerText) : 0;
    const minutes = minElement ? parseInt(minElement.innerText) : 0;

    return hours * 60 + minutes;
}

function createTimeHTML(hours, minutes) {
    return `
    <span class="hour-min">
        <span class="hour-min__hour">
            <span class="hour-min__value">${hours}</span>
            <span class="hour-min__unit">時間</span>
        </span>
        <span class="hour-min__min">
            <span class="hour-min__value">${minutes}</span>
            <span class="hour-min__unit">分</span>
        </span>
    </span>`;
}

function createItemHTML(label, timeHTML) {
    return `
    <div class="item">
        <div class="label">${label}</div>
        <div class="body">
            ${timeHTML}
        </div>
    </div>`;
}

function getLabelElement(labelText) {
    const itemElements = document.querySelectorAll('.main-items .item');
    for (let itemElement of itemElements) {
        const labelElement = itemElement.querySelector('.label');
        if (labelElement && labelElement.innerText.includes(labelText)) {
            return labelElement;
        }
    }
    return null;
}

// 今日以降の残りの勤務日数を計算
function getRemainingWorkdays() {
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let remainingWorkdays = 0;

    let days = document.querySelectorAll('.employee-work-record-timebars .day');
    days.forEach((day) => {
        let date = new Date(day.dataset.date);
        if (date >= today) {
            let dayPattern = day.querySelector('.day-pattern').textContent.trim();
            if (dayPattern === '通常勤務') {
                let workflowType = day.querySelector('.workflow-button .type');
                if (!workflowType || (workflowType.textContent.trim() !== '特別休暇' && workflowType.textContent.trim() !== '有給休暇')) {
                    remainingWorkdays++;
                }
            }
        }
    });

    return remainingWorkdays;
}

// 不足時間と必要労働日数から平均残り時間を計算してページに表示
function updatePage(totalShortageMinutes, remainingWorkdays) {
    let neededWorkMinutesPerDay = totalShortageMinutes / remainingWorkdays;
    let neededWorkHoursPerDay = Math.floor(neededWorkMinutesPerDay / 60);
    let neededWorkMinutesRemainder = Math.floor( neededWorkMinutesPerDay % 60 );

    let timeHTML = createTimeHTML(neededWorkHoursPerDay, neededWorkMinutesRemainder);
    let itemHTML = createItemHTML('平均必要労働時間', timeHTML);

    let mainItemsElement = document.querySelector('.main-items');
    mainItemsElement.insertAdjacentHTML('beforeend', itemHTML);
}

// body要素全体の監視を開始
let bodyObserver = new MutationObserver((mutationsList, observer) => {
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            let loadingCover = document.querySelector('.vb-loading__cover--coverAll');
            if (!loadingCover) {
                let totalShortageMinutes = extractTimeData(getLabelElement("不足時間").parentNode.querySelector('.body'));
                let remainingWorkdays = getRemainingWorkdays();

                if (totalShortageMinutes !== null && remainingWorkdays !== null) {
                    updatePage(totalShortageMinutes, remainingWorkdays);
                }
                observer.disconnect();
            }
        }
    }
});

let config = { childList: true, subtree: true };
bodyObserver.observe(document.body, config);