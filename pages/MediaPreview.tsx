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
    <div className="space-y-6 w-full">
      <button 
        onClick={() => navigate('/media')} 
        className="flex items-center gap-2 text-[#44474e] hover:text-[#1b1b1f] transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Library
      </button>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="flex-1 bg-[#1b1b1f] rounded-2xl flex items-center justify-center min-h-[400px] lg:min-h-[600px] overflow-hidden">
            {media.type === MediaType.VIDEO ? (
              <video src={media.url} controls className="w-full h-full max-h-[600px] object-contain" />
            ) : media.type === MediaType.PDF ? (
              <PDFViewer url={media.url} />
            ) : (
              <img src={media.url} className="w-full h-full max-h-[600px] object-contain" alt={media.name} />
            )}
        </div>
        <Card className="w-full lg:w-96 space-y-6 shrink-0">
            <div>
              <h2 className="text-2xl font-black text-[#1b1b1f] tracking-tight mb-2">{media.name}</h2>
              <div className="space-y-2 text-sm">
                  <p className="text-[#44474e]"><span className="font-bold text-[#1b1b1f]">Type:</span> {media.type}</p>
                  <p className="text-[#44474e]"><span className="font-bold text-[#1b1b1f]">Size:</span> {media.size_mb?.toFixed(1) || '0'} MB</p>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-[#e4e1ec]">
                {media.sourceProvider && (
                  <Button onClick={handleReimport} isLoading={isRefreshing} className="w-full rounded-xl">
                    <Cloud className="w-4 h-4 mr-2" /> Re-import
                  </Button>
                )}
                <Button variant="danger" onClick={handleDelete} className="w-full rounded-xl">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default MediaPreview;
