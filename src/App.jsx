import React, { useState, useEffect } from 'react';

const HorseAnalysisApp = () => {
  const [races, setRaces] = useState([]);
  const [currentRace, setCurrentRace] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [raceName, setRaceName] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [importMessageType, setImportMessageType] = useState('');
  
  const [courseSettings, setCourseSettings] = useState({});
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('races-upcoming');
  const [courseName, setCourseName] = useState('');
  const [tempFactors, setTempFactors] = useState({
    '能力値': 15,
    'コース・距離適性': 18,
    '展開利': 17,
    '近走安定度': 10,
    '馬場適性': 10,
    '騎手': 5,
    '斤量': 10,
    '調教': 15
  });
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [statsFilterCourse, setStatsFilterCourse] = useState(null);
  const [selectedFactors, setSelectedFactors] = useState({
    'タイム指数': true,
    'コース・距離適性': true,
    '展開利': true,
    '近走安定度': true,
    '馬場適性': true,
    '騎手': true,
    '斤量': true,
    '調教': true
  });

  const [showResultModal, setShowResultModal] = useState(false);
  const [resultRanking, setResultRanking] = useState('');
  const [oddsInput, setOddsInput] = useState({});
  const [showOddsModal, setShowOddsModal] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const [showCourseSelectModal, setShowCourseSelectModal] = useState(false);
  const [memo, setMemo] = useState('');
  const [showMemoModal, setShowMemoModal] = useState(false);

  const [raceSelectedCourse, setRaceSelectedCourse] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [raceToDelete, setRaceToDelete] = useState(null);

  const factors = [
    { name: '能力値', weight: 15, key: 'タイム指数' },
    { name: 'コース・距離適性', weight: 18, key: 'コース・距離適性' },
    { name: '展開利', weight: 17, key: '展開利' },
    { name: '近走安定度', weight: 10, key: '近走安定度' },
    { name: '馬場適性', weight: 10, key: '馬場適性' },
    { name: '騎手', weight: 5, key: '騎手' },
    { name: '斤量', weight: 10, key: '斤量' },
    { name: '調教', weight: 15, key: '調教' }
  ];

  useEffect(() => {
    const savedRaces = localStorage.getItem('races');
    const savedSettings = localStorage.getItem('courseSettings');
    
    if (savedRaces) {
      try {
        setRaces(JSON.parse(savedRaces));
      } catch (e) {
        console.error('Failed to load races:', e);
      }
    }
    
    if (savedSettings) {
      try {
        setCourseSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('races', JSON.stringify(races));
  }, [races]);

  useEffect(() => {
    localStorage.setItem('courseSettings', JSON.stringify(courseSettings));
  }, [courseSettings]);

  const parseHorseData = (text) => {
    const lines = text.trim().split('\n');
    const horses = [];

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;
      if (line.includes('馬番') || line.includes('評価')) return;

      const match = line.match(/^(\d{1,2})(.+)$/);
      if (!match) return;

      const horseNum = parseInt(match[1]);
      const restOfLine = match[2];

      let horseName = '';
      let dataStart = 0;
      for (let i = 0; i < restOfLine.length; i++) {
        const char = restOfLine[i];
        if (/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/.test(char)) {
          horseName += char;
        } else if (horseName && /[\d.]/.test(char)) {
          dataStart = i;
          break;
        }
      }

      if (!horseName || dataStart === 0) return;

      const dataString = restOfLine.substring(dataStart);
      const numbers = dataString.match(/[\d.]+/g);

      if (!numbers || numbers.length < 8) return;

      const scores = {
        'タイム指数': parseFloat(numbers[0]) || 0,
        'コース・距離適性': parseFloat(numbers[1]) || 0,
        '展開利': parseFloat(numbers[2]) || 0,
        '近走安定度': parseFloat(numbers[3]) || 0,
        '馬場適性': parseFloat(numbers[4]) || 0,
        '騎手': parseFloat(numbers[5]) || 0,
        '斤量': parseFloat(numbers[6]) || 0,
        '調教': parseFloat(numbers[7]) || 0
      };

      horses.push({
        horseNum,
        name: horseName,
        scores
      });
    });

    return horses;
  };

  const handleDataImport = () => {
    if (!pasteText.trim() || !raceName.trim()) {
      setImportMessage('レース名またはデータが入力されていません');
      setImportMessageType('error');
      setTimeout(() => setImportMessage(''), 3000);
      return;
    }

    const horses = parseHorseData(pasteText);
    
    if (horses.length === 0) {
      setImportMessage('データの解析に失敗しました。形式を確認してください。');
      setImportMessageType('error');
      setTimeout(() => setImportMessage(''), 3000);
      return;
    }

    const newRace = {
      id: Date.now(),
      name: raceName,
      horses,
      createdAt: new Date().toLocaleDateString('ja-JP'),
      courseKey: selectedCourse,
      result: null,
      odds: {},
      memo: ''
    };

    setRaces([...races, newRace]);
    setPasteText('');
    setRaceName('');
    setImportMessage(`${raceName}を追加しました！（${horses.length}頭）`);
    setImportMessageType('success');
    setTimeout(() => {
      setImportMessage('');
      setShowUploadModal(false);
    }, 1500);
  };

  const saveCourseSettings = () => {
    if (!courseName.trim()) {
      alert('コース名を入力してください');
      return;
    }

    const total = Object.values(tempFactors).reduce((a, b) => a + b, 0);
    if (total !== 100) {
      alert(`比重の合計が100%ではありません（現在${total}%）`);
      return;
    }

    setCourseSettings({
      ...courseSettings,
      [courseName]: { ...tempFactors }
    });
    setCourseName('');
    setTempFactors({
      '能力値': 15,
      'コース・距離適性': 18,
      '展開利': 17,
      '近走安定度': 10,
      '馬場適性': 10,
      '騎手': 5,
      '斤量': 10,
      '調教': 15
    });
    setShowSettingsModal(false);
  };

  const deleteCourseSettings = (name) => {
    const newSettings = { ...courseSettings };
    delete newSettings[name];
    setCourseSettings(newSettings);
  };

  const deleteRace = (raceId) => {
    const updatedRaces = races.filter(r => r.id !== raceId);
    setRaces(updatedRaces);
    setShowDeleteConfirm(false);
    setRaceToDelete(null);
  };

  const calculateWinRate = (horses, courseKey = null) => {
    if (!horses || horses.length === 0) return [];

    const weights = courseKey && courseSettings[courseKey]
      ? courseSettings[courseKey]
      : {
        '能力値': 15,
        'コース・距離適性': 18,
        '展開利': 17,
        '近走安定度': 10,
        '馬場適性': 10,
        '騎手': 5,
        '斤量': 10,
        '調教': 15
      };

    const horsesWithScores = horses.map(horse => {
      let totalScore = 0;
      Object.keys(weights).forEach(factor => {
        const factorKey = factor === '能力値' ? 'タイム指数' : factor;
        if (selectedFactors[factorKey]) {
          totalScore += (horse.scores[factorKey] || 0) * (weights[factor] / 100);
        }
      });
      return {
        ...horse,
        totalScore
      };
    });

    const maxScore = Math.max(...horsesWithScores.map(h => h.totalScore));
    const exponentials = horsesWithScores.map(horse => ({
      ...horse,
      exp: Math.exp((horse.totalScore - maxScore) * 0.1)
    }));

    const sumExp = exponentials.reduce((sum, h) => sum + h.exp, 0);

    return exponentials.map(horse => ({
      ...horse,
      winRate: (horse.exp / sumExp) * 100
    })).sort((a, b) => b.winRate - a.winRate);
  };

  const calculateStats = (courseKey = null) => {
    let recordedRaces = races.filter(r => r.result);
    
    if (courseKey) {
      recordedRaces = recordedRaces.filter(r => r.courseKey === courseKey);
    }
    
    if (recordedRaces.length === 0) return null;

    const tanshoHits = recordedRaces.filter(r => r.result.tansho === 'hit').length;
    const fukushoHits = recordedRaces.filter(r => r.result.fukusho === 'hit').length;

    return {
      total: recordedRaces.length,
      tansho: { hits: tanshoHits, rate: ((tanshoHits / recordedRaces.length) * 100).toFixed(1) },
      fukusho: { hits: fukushoHits, rate: ((fukushoHits / recordedRaces.length) * 100).toFixed(1) }
    };
  };

  const handleFactorToggle = (factorKey) => {
    setSelectedFactors({
      ...selectedFactors,
      [factorKey]: !selectedFactors[factorKey]
    });
  };

  const handleSaveResult = () => {
    if (!resultRanking.trim()) {
      alert('着順を入力してください');
      return;
    }

    const resultsWithRate = calculateWinRate(currentRace.horses, raceSelectedCourse);
    const top1 = resultsWithRate[0];

    const ranking = resultRanking.split(/[\s\-,]/);
    
    const resultNums = ranking.map(r => {
      const num = parseInt(r);
      return isNaN(num) ? null : num;
    }).filter(n => n !== null);

    const tanshoDic = resultNums[0] === top1.horseNum ? 'hit' : 'miss';
    const fukushoHit = resultNums.length >= 1 && resultNums.slice(0, 3).includes(top1.horseNum) ? 'hit' : 'miss';

    const updatedRaces = races.map(race =>
      race.id === currentRace.id
        ? {
          ...race,
          result: {
            ranking: resultRanking,
            tansho: tanshoDic,
            fukusho: fukushoHit
          }
        }
        : race
    );

    setRaces(updatedRaces);
    setCurrentRace({
      ...currentRace,
      result: {
        ranking: resultRanking,
        tansho: tanshoDic,
        fukusho: fukushoHit
      }
    });
    setResultRanking('');
    setShowResultModal(false);
  };

  if (!currentRace) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">競馬予想分析ツール</h1>
          <button
            onClick={() => setShowAdminModal(true)}
            className="text-2xl hover:opacity-70"
          >
            ⚙️
          </button>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('races-upcoming')}
            className={`px-6 py-2 rounded-md font-semibold ${
              activeTab === 'races-upcoming' || activeTab === 'races-past'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-800'
            }`}
          >
            レース予想
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-md font-semibold ${
              activeTab === 'settings'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-800'
            }`}
            disabled={!isAdmin}
          >
            コース設定
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-2 rounded-md font-semibold ${
              activeTab === 'stats'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-800'
            }`}
          >
            成績分析
          </button>
        </div>

        {(activeTab === 'races-upcoming' || activeTab === 'races-past') && (
          <div className="bg-white rounded-lg p-6 shadow">
            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-semibold mb-4"
              >
                📤 レースデータを追加
              </button>
            )}
            {!isAdmin && <p className="text-gray-500 text-sm mb-4">※ 管理者のみ追加可能</p>}

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('races-upcoming')}
                className={`px-4 py-2 rounded-md font-semibold ${
                  activeTab === 'races-upcoming'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-800'
                }`}
              >
                レース予想
              </button>
              <button
                onClick={() => setActiveTab('races-past')}
                className={`px-4 py-2 rounded-md font-semibold flex items-center gap-2 ${
                  activeTab === 'races-past'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-800'
                }`}
              >
                過去の予想
                {races.filter(r => r.result?.tansho === 'hit').length > 0 && (
                  <span className="text-lg">✅</span>
                )}
              </button>
            </div>

            {races.length > 0 ? (
              <div className="space-y-2">
                {(activeTab === 'races-upcoming' 
                  ? races.filter(r => !r.result)
                  : races.filter(r => r.result)
                ).map((race) => (
                  <div
                    key={race.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer flex items-center justify-between group"
                  >
                    <div
                      className="flex-1"
                      onClick={() => {
                        setCurrentRace(race);
                        setRaceSelectedCourse(race.courseKey);
                        setMemo(race.memo || '');
                      }}
                    >
                      <h3 className="font-semibold text-gray-800">{race.name}</h3>
                      <p className="text-sm text-gray-600">
                        {race.createdAt} · {race.horses.length}頭
                        {race.courseKey && ` · ${race.courseKey}`}
                        {race.result && ' · 結果: ' + race.result.ranking}
                        {race.result?.tansho === 'hit' && ' ✅'}
                      </p>
                    </div>
                    
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setRaceToDelete(race.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition"
                        title="このレースを削除"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">レースデータがまだありません</p>
            )}
          </div>
        )}

        {activeTab === 'settings' && isAdmin && (
          <div className="bg-white rounded-lg p-6 shadow">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition font-semibold mb-4"
            >
              新しいコース設定を作成
            </button>

            {Object.keys(courseSettings).length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">保存済みコース設定</h2>
                {Object.entries(courseSettings).map(([name, factorData]) => (
                  <div
                    key={name}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-800 text-lg">{name}</h3>
                      <button
                        onClick={() => deleteCourseSettings(name)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md transition"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {Object.entries(factorData).map(([factor, weight]) => (
                        <div key={factor} className="bg-white p-2 rounded border border-gray-200">
                          <div className="text-gray-600 text-xs">{factor}</div>
                          <div className="font-bold text-blue-600">{weight}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">保存されたコース設定がありません</p>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">成績分析</h2>
            
            {calculateStats(statsFilterCourse) ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">単勝</h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {calculateStats(statsFilterCourse).tansho.rate}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {calculateStats(statsFilterCourse).tansho.hits}/{calculateStats(statsFilterCourse).total}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">複勝</h3>
                  <div className="text-2xl font-bold text-green-600">
                    {calculateStats(statsFilterCourse).fukusho.rate}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {calculateStats(statsFilterCourse).fukusho.hits}/{calculateStats(statsFilterCourse).total}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">結果が記録されたレースがありません</p>
            )}
          </div>
        )}

        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-lg max-h-96 overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">新しいコース設定を作成</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">コース名</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="例：新潟千直、京都ダ1400"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-3">比重設定（合計100%）</label>
                <div className="space-y-2">
                  {Object.entries(tempFactors).map(([factor, weight]) => (
                    <div key={factor} className="flex items-center gap-3">
                      <label className="w-40 text-sm text-gray-700">{factor}</label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setTempFactors({
                          ...tempFactors,
                          [factor]: parseInt(e.target.value) || 0
                        })}
                        className="w-20 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-blue-100 rounded text-sm text-blue-800">
                  合計: {Object.values(tempFactors).reduce((a, b) => a + b, 0)}%
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveCourseSettings}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition font-semibold"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    setCourseName('');
                    setTempFactors({
                      '能力値': 15,
                      'コース・距離適性': 18,
                      '展開利': 17,
                      '近走安定度': 10,
                      '馬場適性': 10,
                      '騎手': 5,
                      '斤量': 10,
                      '調教': 15
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">レースデータを追加</h3>

              {importMessage && (
                <div className={`p-3 rounded-md mb-4 ${
                  importMessageType === 'success' 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {importMessage}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">レース名</label>
                <input
                  type="text"
                  value={raceName}
                  onChange={(e) => setRaceName(e.target.value)}
                  placeholder="例：京都12R 嵯峨野特別"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">コース設定を選択（オプション）</label>
                <select
                  value={selectedCourse || ''}
                  onChange={(e) => setSelectedCourse(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">デフォルト設定を使用</option>
                  {Object.keys(courseSettings).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">データ（コピペ）</label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="w-full h-48 p-3 border border-gray-300 rounded-md font-mono text-sm"
                  placeholder="データをここにペーストしてください"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDataImport}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition font-semibold"
                >
                  追加
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setPasteText('');
                    setRaceName('');
                    setImportMessage('');
                    setSelectedCourse(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {showAdminModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">管理者パスコード</h3>
              
              {isAdmin && (
                <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
                  ✓ 管理者モード有効
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">パスコードを入力</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="パスコード"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (adminPassword === '1234') {
                      setIsAdmin(true);
                      setAdminPassword('');
                      setShowAdminModal(false);
                    } else {
                      alert('パスコードが違います');
                      setAdminPassword('');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition font-semibold"
                >
                  認証
                </button>
                <button
                  onClick={() => {
                    if (isAdmin) {
                      setIsAdmin(false);
                    }
                    setShowAdminModal(false);
                    setAdminPassword('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                >
                  {isAdmin ? 'ログアウト' : 'キャンセル'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-red-600">レースを削除しますか？</h3>
              <p className="text-gray-700 mb-6">
                この操作は取り消せません。本当に削除してもよろしいですか？
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => deleteRace(raceToDelete)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition font-semibold"
                >
                  削除する
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setRaceToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const resultsWithRate = calculateWinRate(currentRace.horses, raceSelectedCourse);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{currentRace.name}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {currentRace.createdAt} · {currentRace.horses.length}頭
            {raceSelectedCourse && ` · ${raceSelectedCourse}`}
          </p>
        </div>
        <button
          onClick={() => setCurrentRace(null)}
          className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
        >
          ← 戻る
        </button>
      </div>

      {currentRace.result && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-2">結果記録済み</h3>
          <p className="text-sm text-green-700">着順: {currentRace.result.ranking}</p>
        </div>
      )}

      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">ファクター選択</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded">
          {Object.entries(selectedFactors).map(([factorKey, isSelected]) => (
            <label key={factorKey} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleFactorToggle(factorKey)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">{factorKey}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">勝率ランキング</h2>
            {raceSelectedCourse && (
              <p className="text-xs text-gray-500 mt-1">コース設定: {raceSelectedCourse}</p>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            {isAdmin && (
              <button
                onClick={() => setShowCourseSelectModal(true)}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 font-semibold text-sm"
              >
                コース設定変更
              </button>
            )}
            <button
              onClick={() => {
                setOddsInput(currentRace.odds || {});
                setShowOddsModal(true);
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-semibold"
            >
              オッズを入力
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowResultModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-semibold"
              >
                結果を記録
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {resultsWithRate.map((horse, idx) => {
            const odds = oddsInput[horse.horseNum] || 0;
            const value = odds * horse.winRate;
            const isGoodValue = horse.winRate >= 10 && value >= 150;
            
            return (
              <div
                key={horse.horseNum}
                className={`p-4 rounded-lg border-2 ${
                  isGoodValue && odds > 0 
                    ? 'bg-yellow-200 border-yellow-400' 
                    : idx === 0 ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl font-bold text-gray-700 min-w-12">
                      {idx + 1}位
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800">
                        {horse.horseNum}. {horse.name}
                      </div>
                      {odds > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          オッズ {odds.toFixed(1)} × 勝率 {horse.winRate.toFixed(1)}% = {value.toFixed(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {horse.winRate.toFixed(1)}%
                    </div>
                    {odds > 0 && (
                      <div className={`text-sm font-semibold mt-1 ${isGoodValue ? 'text-yellow-700' : 'text-gray-600'}`}>
                        {isGoodValue ? '期待値馬！' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">メモ</h2>
          {isAdmin && (
            <button
              onClick={() => setShowMemoModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-semibold text-sm"
            >
              編集
            </button>
          )}
        </div>
        <div className="p-4 bg-gray-50 rounded border border-gray-200 min-h-32">
          <p className="text-gray-700 whitespace-pre-wrap">{memo || '（メモなし）'}</p>
        </div>
      </div>

      {showCourseSelectModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">コース設定を選択</h3>
            
            <div className="space-y-2 mb-6">
              <button
                onClick={() => {
                  setRaceSelectedCourse(null);
                  setShowCourseSelectModal(false);
                }}
                className={`w-full px-4 py-2 rounded-md text-left font-semibold transition ${
                  raceSelectedCourse === null
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                デフォルト設定
              </button>
              {Object.keys(courseSettings).map(name => (
                <button
                  key={name}
                  onClick={() => {
                    setRaceSelectedCourse(name);
                    setShowCourseSelectModal(false);
                  }}
                  className={`w-full px-4 py-2 rounded-md text-left font-semibold transition ${
                    raceSelectedCourse === name
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCourseSelectModal(false)}
              className="w-full px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {showMemoModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">メモを編集</h3>
            
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full h-48 p-3 border border-gray-300 rounded-md font-mono text-sm mb-4"
              placeholder="見解、印、買い目など..."
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const updatedRaces = races.map(race =>
                    race.id === currentRace.id
                      ? { ...race, memo }
                      : race
                  );
                  setRaces(updatedRaces);
                  setCurrentRace({ ...currentRace, memo });
                  setShowMemoModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-semibold"
              >
                保存
              </button>
              <button
                onClick={() => setShowMemoModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {showOddsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">オッズを入力</h3>
            
            <div className="space-y-2 mb-6">
              {currentRace.horses.sort((a, b) => a.horseNum - b.horseNum).map((horse) => (
                <div key={horse.horseNum} className="flex items-center gap-2">
                  <label className="text-xs text-gray-700 w-32">{horse.horseNum}. {horse.name}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={oddsInput[horse.horseNum] || ''}
                    onChange={(e) => setOddsInput({...oddsInput, [horse.horseNum]: parseFloat(e.target.value) || 0})}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                    placeholder="オッズ"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const updatedRaces = races.map(race =>
                    race.id === currentRace.id
                      ? { ...race, odds: oddsInput }
                      : race
                  );
                  setRaces(updatedRaces);
                  setCurrentRace({ ...currentRace, odds: oddsInput });
                  setShowOddsModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-semibold text-sm"
              >
                保存
              </button>
              <button
                onClick={() => setShowOddsModal(false)}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {showResultModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">着順を記録</h3>
            
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-600 mb-2 block">着順を馬番で入力</label>
              <p className="text-xs text-gray-500 mb-3">例：8-15-5</p>
              <input
                type="text"
                value={resultRanking}
                onChange={(e) => setResultRanking(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm"
                placeholder="8-15-5"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveResult}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-semibold"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setShowResultModal(false);
                  setResultRanking('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HorseAnalysisApp;
