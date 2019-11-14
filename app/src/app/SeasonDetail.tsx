import React from 'react';
import { SeasonModel } from '../state/reducer';
import { Link, useParams } from 'react-router-dom';

interface SeasonDetailProps {
  season: SeasonModel | undefined;
}

const SeasonDetail: React.FC<SeasonDetailProps> = ({ season }) => {
  const { seasonId } = useParams();

  return (
    <div>
      <Link to={"/"}>Back</Link>
      <p>{seasonId}</p>
      <p>{JSON.stringify(season)}</p>
    </div>
  );
}

export default SeasonDetail;
