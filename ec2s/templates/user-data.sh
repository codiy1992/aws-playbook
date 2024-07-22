#! /bin/bash
# Step1: Kernel Optimization
echo '
* soft nofile 65536
* hard nofile 65536
' >> /etc/security/limits.conf

# Step2: Install requirements
yum update -y && yum install -y git docker wget

{% if (block_disk_size > 0) %}
# Step3: Mount EBS
mkfs -t xfs /dev/sdb
mkdir -p {{ block_disk_mount_path }}
mount /dev/sdb {{ block_disk_mount_path }}
cp /etc/fstab /etc/fstab.orig
UUID=$(blkid | grep /dev/nvme1n1 | sed -r 's/.*UUID="([^"]*).*"/UUID=\1/')
MOUNT="{{ block_disk_mount_path }}  xfs  defaults,nofail  0  2"
echo "${UUID}  ${MOUNT}" >> /etc/fstab
chown -R ec2-user.ec2-user {{ block_disk_mount_path }}
{% endif %}

# Step4: Config docker
systemctl enable docker
systemctl start docker
usermod -a -G docker ec2-user

# Step5: Config vim
wget -O /home/ec2-user/.vimrc https://s3.codiy.net/2024/01/ec2.vimrc
cp --force /home/ec2-user/.vimrc /root/.vimrc
chown ec2-user.ec2-user /home/ec2-user/.vimrc

# Step7: Install Docker Compose
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://s3.codiy.net/2024/01/docker-compose-linux-aarch64 -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

