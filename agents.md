0) 공통 지시문
Node 20 LTS 기준으로 진행
외부 유료 에셋 금지(placeholder로 진행)
결과는 정적 배포 가능한 단일 프론트 앱(백엔드/서버 없음)
PR에 How to run, How to build를 포함하고 npm run build가 성공해야 함
밸런스 JSON은 이미 존재하며(src\config\balance.demo_10min_v1.json), 절대 하드코딩하지 말고 로드해서 사용
업그레이드/상태 저장 키 이름 규칙
1) Game State & Logic Specifications
   - State Variables:
     - fur (Start: 0)
     - totalFurEarned (Start: 0)
     - fpc (Start: 1)
     - fps (Start: 0)
     - globalMult (Start: 1)
     - critChance (Start: 0.05)
     - critMult (Start: 10)
   - Mechanics:
     - Auto-production: fur += fps * deltaTime * globalMult
     - Click:
       - gain = fpc * globalMult
       - If random() < critChance, gain *= critMult
       - fur += gain, totalFurEarned += gain
   - UI:
     - Display Fur (integer), FPC, FPS, globalMult, critChance (%)
     - Real-time updates

2) Upgrade System & Shop
   - Balance Source: src/config/balance.demo_10min_v1.json
   - Upgrade Logic:
     - Cost: Defined in JSON 'costs' array (index = level).
     - Effects: Dynamic calculation based on level and JSON 'effect' fields.
     - Unlocks: Dependent on 'totalFurEarned' (or other conditions in JSON).
   - Shop UI:
     - Auto-generated from JSON 'upgrades' list.
     - Cards display: Name, Level, Cost, Effect, Buy Button.
     - Visual feedback for locked items and affordability.
