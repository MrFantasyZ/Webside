/**
 * VIP 内容转换工具
 *
 * 根据用户的 VIP 状态返回不同的视频内容
 */

interface VideoContent {
  thumbnailUrl: string;
  innerCoverUrl?: string;
  videoUrl: string;
}

/**
 * 获取视频内容路径
 *
 * @param videoId - 视频 ID 或编号 (1-6)
 * @param isVIP - 是否为 VIP 用户
 * @returns 视频内容路径对象
 */
export function getVideoContent(videoId: string | number, isVIP: boolean): VideoContent {
  // 将视频 ID 转换为数字（如果是 MongoDB ObjectId，提取数字部分）
  let videoNumber: number;

  if (typeof videoId === 'number') {
    videoNumber = videoId;
  } else {
    // 转换为字符串（处理 MongoDB ObjectId）
    const videoIdStr = String(videoId);

    // 尝试从 ID 中提取数字（简化处理，实际应用中可能需要映射表）
    // 这里假设 videoId 的最后一位是视频编号 1-6
    const match = videoIdStr.match(/\d+$/);
    if (match) {
      videoNumber = parseInt(match[0]) % 6 || 6; // 1-6 循环
    } else {
      // 如果无法提取，使用哈希方式映射到 1-6
      const hash = videoIdStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      videoNumber = (hash % 6) + 1;
    }
  }

  // 确保在 1-6 范围内
  if (videoNumber < 1 || videoNumber > 6) {
    videoNumber = ((videoNumber - 1) % 6) + 1;
  }

  const baseDir = `/test_video/${videoNumber}`;

  if (isVIP) {
    // VIP 用户：返回高清封面和高清视频
    return {
      thumbnailUrl: `${baseDir}/fengmian_out.png`,
      innerCoverUrl: `${baseDir}/fengmian_in.png`,
      videoUrl: `${baseDir}/V2.zip`
    };
  } else {
    // 普通用户：返回 AI 生成封面和普通视频
    return {
      thumbnailUrl: `${baseDir}/AI_fengmian_out.png`,
      innerCoverUrl: `${baseDir}/AI_fengmian_in.png`,
      videoUrl: `${baseDir}/AI_video.mp4`
    };
  }
}

/**
 * 转换视频对象，根据 VIP 状态替换 URL
 *
 * @param video - 原始视频对象
 * @param isVIP - 是否为 VIP 用户
 * @returns 转换后的视频对象
 */
export function transformVideoForVIP(video: any, isVIP: boolean): any {
  if (!video) return video;

  // 如果是普通对象
  if (video.toObject && typeof video.toObject === 'function') {
    video = video.toObject();
  }

  // 获取视频对应的内容路径
  const content = getVideoContent(video._id || video.id, isVIP);

  // 返回新对象，包含 VIP 状态对应的 URL
  return {
    ...video,
    thumbnailUrl: content.thumbnailUrl,
    innerCoverUrl: content.innerCoverUrl,
    // videoUrl 暂时不在列表和详情中暴露，仅在下载时提供
    _isVIP: isVIP // 用于调试，生产环境可以移除
  };
}

/**
 * 批量转换视频数组
 *
 * @param videos - 视频数组
 * @param isVIP - 是否为 VIP 用户
 * @returns 转换后的视频数组
 */
export function transformVideosForVIP(videos: any[], isVIP: boolean): any[] {
  return videos.map(video => transformVideoForVIP(video, isVIP));
}

/**
 * 获取下载 URL
 *
 * @param videoId - 视频 ID 或编号
 * @param isVIP - 是否为 VIP 用户
 * @returns 下载 URL
 */
export function getDownloadUrl(videoId: string | number, isVIP: boolean): string {
  const content = getVideoContent(videoId, isVIP);
  return content.videoUrl;
}
