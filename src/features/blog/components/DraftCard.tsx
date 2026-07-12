export function DraftCard() {
  return (
    <div className="mt-5">
      <div className="flex h-[43px] items-center justify-between rounded-xl bg-[#edf5d9] px-4 text-[12px]">
        <span className="flex items-center gap-2"><span className="text-lg">✨</span> AI 작성 초안</span>
        <span className="flex gap-3"><button className="rounded-full bg-[#819650] px-3 py-1 text-white">저장하기</button><button className="rounded-full bg-[#a5b68a] px-3 py-1 text-white">복사하기</button></span>
      </div>
      <article className="mt-3 rounded-xl border-2 border-[#bed793] bg-white px-[22px] py-5 text-[13px]">
        <h2 className="text-[15px] font-bold">[여행기록] 3월 31일 ~ 4월 1일</h2><p className="mt-4">여행 후기</p><hr className="my-4 border-black"/>
        <DraftSection title="1. 포그레인 공원" content={<>오아시스 형제가 축구하던 그곳!!<br/>근처 맛집에서 햄버거 사와서 무작정<br/>즐긴 피크닉... 생각보다 괜찮을지도...?</>} imageClass="bg-[linear-gradient(135deg,#d9d7d0,#777)]" />
        <hr className="my-4 border-black"/>
        <DraftSection title="2. 마트" content={<>첫끼로 근처 마트에 왔다!<br/>물 사려고 음료 섹션에 왔는데 물을 파는데</>} imageClass="bg-[linear-gradient(135deg,#e6c563,#bd442d)]" />
      </article>
    </div>
  );
}

function DraftSection({ title, content, imageClass }: { title: string; content: React.ReactNode; imageClass: string }) {
  return <><h3 className="font-bold">{title}</h3><div className="mt-2 flex gap-3 leading-6 text-[#555]"><p>{content}</p><div className={`h-[78px] w-[78px] shrink-0 rounded-[22px] ${imageClass}`}/></div></>;
}
