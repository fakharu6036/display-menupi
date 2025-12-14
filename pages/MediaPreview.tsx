import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { MediaType, MediaItem } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PDFViewer } from '../components/PDFViewer';
import { ArrowLeft, Trash2, Download, Cloud, RefreshCw } from 'lucide-react';

const MediaPreview: React.FC = () => {
  const { mediaId } = useParams<{ mediaId: string }>();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
      const load = async () => {
          const all = await StorageService.getMedia();
          const found = all.find(m => m.id === mediaId);
          setMedia(found || null);
      };
      load();
  }, [mediaId]);

  if (!media) return <div className="p-8">Loading or not found...</div>;

  const handleDelete = async () => {
    if (confirm('Delete?')) {
        await StorageService.deleteMedia(media.id);
        navigate('/media');
    }
  };

  const handleReimport = async () => {
      setIsRefreshing(true);
      await StorageService.reimportMedia(media.id);
      setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/media')} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-slate-900 flex items-center justify-center min-h-[500px] rounded-xl overflow-hidden">
            {media.type === MediaType.VIDEO ? (
              <video src={media.url} controls className="w-full h-full max-h-[80vh] object-contain" />
            ) : media.type === MediaType.PDF ? (
              <div className="w-full h-full min-h-[500px] bg-white">
                <PDFViewer url={media.url} title={media.name} />
              </div>
            ) : (
              <img src={media.url} alt={media.name} className="w-full h-full max-h-[80vh] object-contain" />
            )}
        </div>
        <Card className="w-full lg:w-96 space-y-4 flex-shrink-0">
            <h2 className="text-xl font-bold">{media.name}</h2>
            <div className="space-y-2">
                <p className="text-sm"><span className="font-semibold text-slate-600">Type:</span> {media.type.toUpperCase()}</p>
                <p className="text-sm"><span className="font-semibold text-slate-600">Size:</span> {media.size}</p>
            </div>
            <div className="space-y-2 pt-4 border-t border-slate-200">
                {media.sourceProvider && (
                  <Button onClick={handleReimport} isLoading={isRefreshing} className="w-full">
                    <Cloud className="w-4 h-4 mr-2" />
                    Re-import
                  </Button>
                )}
                <Button variant="danger" onClick={handleDelete} className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default MediaPreview;
